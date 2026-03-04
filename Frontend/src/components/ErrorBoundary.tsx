import React, { Component, ReactNode } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';

interface Props {
    children: ReactNode;
    /** Optional fallback to override the default error UI */
    fallback?: ReactNode;
    /**
     * Called when an error is caught. Use for crash reporting:
     *   onError={(err, info) => Sentry.captureException(err, { extra: info })}
     */
    onError?: (error: Error, info: React.ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * ErrorBoundary — catches any unhandled JS errors in the component tree
 * and renders a user-friendly fallback instead of crashing the app silently.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <NavigationContainer />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo): void {
        // Report to crash analytics — swap console.error for Sentry in production:
        //   Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
        this.props.onError?.(error, info);
        console.error('[ErrorBoundary] Uncaught error:', error, info);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <View style={styles.container}>
                    <Text style={styles.icon}>⚠️</Text>
                    <Text style={styles.title}>Something went wrong</Text>
                    <Text style={styles.message}>
                        An unexpected error occurred. Please try again.
                    </Text>
                    {__DEV__ && this.state.error && (
                        <View style={styles.devBox}>
                            <Text style={styles.devTitle}>Debug (dev only):</Text>
                            <Text style={styles.devText} numberOfLines={6}>
                                {this.state.error.toString()}
                            </Text>
                        </View>
                    )}
                    <TouchableOpacity
                        style={styles.button}
                        onPress={this.handleRetry}
                        accessibilityRole="button"
                        accessibilityLabel="Retry"
                    >
                        <Text style={styles.buttonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 24,
    },
    icon: {
        fontSize: 48,
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    button: {
        backgroundColor: '#F37254',
        borderRadius: 10,
        paddingHorizontal: 32,
        paddingVertical: 12,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    devBox: {
        backgroundColor: '#FFF0F0',
        borderRadius: 8,
        padding: 12,
        width: '100%',
        marginBottom: 16,
        borderLeftWidth: 3,
        borderLeftColor: '#FF3B30',
    },
    devTitle: {
        fontWeight: '700',
        color: '#CC0000',
        fontSize: 11,
        marginBottom: 4,
    },
    devText: {
        fontFamily: 'monospace',
        fontSize: 10,
        color: '#CC0000',
    },
});

export default ErrorBoundary;
