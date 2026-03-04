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
        // Log to console in dev; swap for Sentry.captureException(error, { extra: info }) in prod
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
});

export default ErrorBoundary;
