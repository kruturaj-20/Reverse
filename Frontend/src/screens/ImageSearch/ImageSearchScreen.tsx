import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Animated,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import { RootStackParamList } from '../../navigation/types';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { ProductCard } from '../../components/product/ProductCard';
import { Product } from '../../data/mockProducts';
import { imageSearch } from '../../services/search';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export const ImageSearchScreen = () => {
    const navigation = useNavigation<NavProp>();
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState<Product[]>([]);
    const [detectedLabel, setDetectedLabel] = useState('');
    const [error, setError] = useState<string | null>(null);
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    const startPulse = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
            ]),
        ).start();
    };

    const stopPulse = () => {
        pulseAnim.stopAnimation();
        pulseAnim.setValue(1);
    };

    const runImageSearch = async (uri: string, type: string) => {
        setIsProcessing(true);
        setResults([]);
        setError(null);
        setDetectedLabel('');
        startPulse();

        try {
            const res = await imageSearch(uri, type);
            setResults(res.data);
            setDetectedLabel(res.meta?.query || 'Similar Products');
        } catch (err: any) {
            console.error('Image search failed', err);
            setError(err?.message || 'Could not process image. Is the backend running?');
        } finally {
            setIsProcessing(false);
            stopPulse();
        }
    };

    const pickFromGallery = async () => {
        const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
        if (result.assets && result.assets[0]?.uri) {
            const asset = result.assets[0];
            setImageUri(asset.uri!);
            await runImageSearch(asset.uri!, asset.type || 'image/jpeg');
        }
    };

    const pickFromCamera = async () => {
        const result = await launchCamera({ mediaType: 'photo', quality: 0.8 });
        if (result.assets && result.assets[0]?.uri) {
            const asset = result.assets[0];
            setImageUri(asset.uri!);
            await runImageSearch(asset.uri!, asset.type || 'image/jpeg');
        }
    };

    const handleUpload = () => {
        Alert.alert(
            'Search by Image',
            'Choose a source',
            [
                { text: '📷 Camera', onPress: pickFromCamera },
                { text: '🖼 Gallery', onPress: pickFromGallery },
                { text: 'Cancel', style: 'cancel' },
            ],
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Text style={styles.backIcon}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>📸 Search by Image</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Upload zone */}
                <TouchableOpacity onPress={handleUpload} activeOpacity={0.85} style={styles.uploadZone}>
                    {imageUri ? (
                        <View style={styles.imagePreview}>
                            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                            {isProcessing && (
                                <View style={styles.processingOverlay}>
                                    <Animated.View style={[styles.scanRing, { transform: [{ scale: pulseAnim }] }]}>
                                        <LinearGradient colors={[Colors.primary, Colors.accent]} style={styles.scanRingGradient} />
                                    </Animated.View>
                                    <Text style={styles.processingText}>✨ AI Analyzing...</Text>
                                    <Text style={styles.processingSubtext}>Gemini Vision is identifying the product</Text>
                                </View>
                            )}
                        </View>
                    ) : (
                        <LinearGradient colors={[Colors.surface, Colors.surfaceElevated]} style={styles.uploadPlaceholder}>
                            <Text style={styles.uploadIcon}>📷</Text>
                            <Text style={styles.uploadTitle}>Upload a Product Image</Text>
                            <Text style={styles.uploadSub}>AI will find similar items across stores</Text>
                            <View style={styles.uploadBtn}>
                                <Text style={styles.uploadBtnText}>Choose Photo</Text>
                            </View>
                        </LinearGradient>
                    )}
                </TouchableOpacity>

                {/* Tips (only when no image) */}
                {!imageUri && (
                    <View style={styles.tips}>
                        <Text style={styles.tipsTitle}>💡 Tips for best results</Text>
                        {['Clear product on plain background', 'Avoid blurry or dark photos', 'Include the full product in frame'].map((tip, i) => (
                            <View key={i} style={styles.tipRow}>
                                <Text style={styles.tipDot}>✅</Text>
                                <Text style={styles.tipText}>{tip}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Re-upload button */}
                {imageUri && !isProcessing && (
                    <TouchableOpacity onPress={handleUpload} style={styles.reuploadBtn}>
                        <Text style={styles.reuploadText}>📁 Try Another Image</Text>
                    </TouchableOpacity>
                )}

                {/* Error state */}
                {error && !isProcessing && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorIcon}>⚠️</Text>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity onPress={handleUpload} style={styles.retryBtn}>
                            <Text style={styles.retryText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Results */}
                {results.length > 0 && !isProcessing && (
                    <View style={styles.resultsSection}>
                        <Text style={styles.resultsTitle}>🔍 Similar Products Found</Text>
                        {detectedLabel ? (
                            <View style={styles.detectedBadge}>
                                <Text style={styles.detectedText}>✨ AI detected: "{detectedLabel}"</Text>
                            </View>
                        ) : null}
                        <Text style={styles.resultsSubtitle}>{results.length} matches across stores</Text>
                        <View style={styles.grid}>
                            {results.map(p => (
                                <View key={p.id} style={styles.gridItem}>
                                    <ProductCard
                                        product={p}
                                        onPress={() => navigation.navigate('ProductDetail', { productId: p.id })}
                                    />
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    safeArea: {},
    scroll: { paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    backIcon: { color: Colors.textPrimary, fontSize: Typography.xl, fontWeight: '300' },
    title: { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: '700' },
    uploadZone: { marginHorizontal: Spacing.base, borderRadius: BorderRadius.xl, overflow: 'hidden', marginTop: Spacing.md },
    uploadPlaceholder: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xxxl, gap: Spacing.md, borderWidth: 2, borderColor: Colors.primary + '44', borderStyle: 'dashed', borderRadius: BorderRadius.xl },
    uploadIcon: { fontSize: 60 },
    uploadTitle: { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: '700' },
    uploadSub: { color: Colors.textSecondary, fontSize: Typography.sm, textAlign: 'center' },
    uploadBtn: { backgroundColor: Colors.primaryGhost, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.primary },
    uploadBtnText: { color: Colors.primary, fontWeight: '700' },
    imagePreview: { height: 300, position: 'relative', borderRadius: BorderRadius.xl, overflow: 'hidden' },
    previewImage: { width: '100%', height: '100%' },
    processingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.overlay, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
    scanRing: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden' },
    scanRingGradient: { width: '100%', height: '100%', opacity: 0.7 },
    processingText: { color: Colors.white, fontSize: Typography.md, fontWeight: '700' },
    processingSubtext: { color: Colors.white + 'AA', fontSize: Typography.xs, textAlign: 'center' },
    tips: { margin: Spacing.base, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.base, gap: Spacing.xs, borderWidth: 1, borderColor: Colors.surfaceBorder },
    tipsTitle: { color: Colors.textPrimary, fontSize: Typography.md, fontWeight: '700', marginBottom: Spacing.xs },
    tipRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
    tipDot: { fontSize: 12, marginTop: 2 },
    tipText: { color: Colors.textSecondary, fontSize: Typography.sm, flex: 1 },
    reuploadBtn: { marginHorizontal: Spacing.base, marginTop: Spacing.md, padding: Spacing.md, backgroundColor: Colors.surfaceElevated, borderRadius: BorderRadius.full, alignItems: 'center', borderWidth: 1, borderColor: Colors.surfaceBorder },
    reuploadText: { color: Colors.textSecondary, fontSize: Typography.base, fontWeight: '600' },
    errorBox: { margin: Spacing.base, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderColor: Colors.error ?? '#ef4444' },
    errorIcon: { fontSize: 36 },
    errorText: { color: Colors.textSecondary, fontSize: Typography.sm, textAlign: 'center' },
    retryBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, marginTop: Spacing.xs },
    retryText: { color: Colors.white, fontWeight: '700' },
    resultsSection: { paddingHorizontal: Spacing.base, marginTop: Spacing.xl },
    resultsTitle: { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: '700' },
    detectedBadge: { backgroundColor: Colors.primaryGhost, borderRadius: BorderRadius.md, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.primary + '33', marginTop: Spacing.xs },
    detectedText: { color: Colors.primaryLight, fontSize: Typography.xs, fontWeight: '600' },
    resultsSubtitle: { color: Colors.textMuted, fontSize: Typography.sm, marginTop: 4, marginBottom: Spacing.base },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    gridItem: { width: '48%' },
});
