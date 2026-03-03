import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { Colors, Typography, Spacing, Shadows } from '../../theme';

type RouteP = RouteProp<RootStackParamList, 'InAppBrowser'>;

export const InAppBrowserScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<RouteP>();
    const { url, title } = route.params;

    const [isLoading, setIsLoading] = useState(true);

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                        <Text style={styles.closeIcon}>✕</Text>
                    </TouchableOpacity>
                    <Text style={styles.title} numberOfLines={1}>
                        {title || 'Checkout'}
                    </Text>
                    <View style={styles.placeholder} />
                </View>
            </SafeAreaView>

            {isLoading && (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            )}

            <WebView
                source={{ uri: url }}
                style={styles.webview}
                onLoadStart={() => setIsLoading(true)}
                onLoadEnd={() => setIsLoading(false)}
                javaScriptEnabled={true}
                domStorageEnabled={true}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
        ...Shadows.sm,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.sm,
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeIcon: {
        fontSize: Typography.lg,
        color: Colors.textPrimary,
        fontWeight: '600',
    },
    title: {
        flex: 1,
        textAlign: 'center',
        fontSize: Typography.md,
        fontWeight: '700',
        color: Colors.textPrimary,
        paddingHorizontal: Spacing.sm,
    },
    placeholder: {
        width: 40, // Match closeBtn width for centering title
    },
    webview: {
        flex: 1,
    },
    loaderContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background + '80', // semi-transparent
        zIndex: 1,
    }
});
