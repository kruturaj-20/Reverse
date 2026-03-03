import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../../navigation/types';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const RECENT_SEARCHES = [
    'white sneakers under ₹2000',
    'wireless headphones',
    'denim jacket men',
    'air fryer 4L',
];

const TRENDING_KEYWORDS = [
    '🔥 Summer dresses',
    '🎮 Gaming chairs',
    '📱 iPhone 15 cases',
    '👟 Adidas campus',
    '💄 Lip gloss combo',
    '🧴 Serum under ₹500',
    '👜 Sling bags',
    '⌚ Smartwatch under ₹3000',
];

export const SearchScreen = () => {
    const navigation = useNavigation<NavProp>();
    const [query, setQuery] = useState('');
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 100);
    }, []);

    const handleSearch = () => {
        if (!query.trim()) return;
        Keyboard.dismiss();
        navigation.navigate('Results', { query: query.trim() });
    };

    const handleSuggestion = (text: string) => {
        const clean = text.replace(/^[^\w₹]+ ?/, '');
        navigation.navigate('Results', { query: clean });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
            <SafeAreaView>
                {/* Header search bar */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-back" size={22} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <View style={styles.inputWrapper}>
                        <Icon name="search-outline" size={16} color={Colors.textMuted} />
                        <TextInput
                            ref={inputRef}
                            style={styles.input}
                            value={query}
                            onChangeText={setQuery}
                            placeholder='Describe what you want...'
                            placeholderTextColor={Colors.textMuted}
                            onSubmitEditing={handleSearch}
                            returnKeyType="search"
                        />
                        {query.length > 0 && (
                            <TouchableOpacity onPress={() => setQuery('')}>
                                <Icon name="close-circle" size={18} color={Colors.textMuted} />
                            </TouchableOpacity>
                        )}
                    </View>
                    {/* Image search button */}
                    <TouchableOpacity style={styles.imgBtn} onPress={() => navigation.navigate('ImageSearch')}>
                        <Icon name="camera-outline" size={22} color={Colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* AI hint */}
                <View style={styles.aiHint}>
                    <Text style={styles.aiHintText}>✨ Try: "running shoes under ₹3000" or "blue formal shirt size M"</Text>
                </View>
            </SafeAreaView>

            <FlatList
                data={[]}
                keyExtractor={() => ''}
                renderItem={null}
                ListHeaderComponent={
                    <>
                        {/* Recent Searches */}
                        {query.length === 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>Recent</Text>
                                    <TouchableOpacity><Text style={styles.clearAll}>Clear all</Text></TouchableOpacity>
                                </View>
                                {RECENT_SEARCHES.map((item, i) => (
                                    <TouchableOpacity key={i} style={styles.recentItem} onPress={() => handleSuggestion(item)}>
                                        <Icon name="time-outline" size={16} color={Colors.textMuted} />
                                        <Text style={styles.recentText}>{item}</Text>
                                        <Icon name="arrow-forward-outline" size={14} color={Colors.textMuted} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Trending */}
                        {query.length === 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Trending right now</Text>
                                <View style={styles.trendingGrid}>
                                    {TRENDING_KEYWORDS.map((kw, i) => (
                                        <TouchableOpacity key={i} onPress={() => handleSuggestion(kw)} style={styles.trendChip}>
                                            <Text style={styles.trendChipText}>{kw}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Live suggestion (simple prefix match) */}
                        {query.length > 1 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Search for</Text>
                                {[query, `${query} under ₹1000`, `${query} under ₹3000`, `best ${query}`].map((s, i) => (
                                    <TouchableOpacity key={i} style={styles.recentItem} onPress={() => { setQuery(s); navigation.navigate('Results', { query: s }); }}>
                                        <Icon name="search-outline" size={16} color={Colors.textMuted} />
                                        <Text style={styles.recentText}>{s}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </>
                }
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 120 }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.sm,
        gap: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.surfaceBorder,
    },
    backBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.accentLight,
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.accentLight,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
        height: 46,
        borderWidth: 1,
        borderColor: Colors.primary + '40',
    },
    input: {
        flex: 1,
        color: Colors.textPrimary,
        fontSize: Typography.base,
        paddingVertical: 0,
    },
    imgBtn: {
        backgroundColor: Colors.primaryGhost,
        borderRadius: BorderRadius.md,
        width: 46,
        height: 46,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.primary + '44',
    },
    aiHint: {
        marginHorizontal: Spacing.base,
        marginTop: Spacing.sm,
        marginBottom: Spacing.xs,
        backgroundColor: Colors.accentLight,
        borderRadius: BorderRadius.md,
        padding: Spacing.sm,
        borderLeftWidth: 3,
        borderLeftColor: Colors.primary,
    },
    aiHintText: { color: Colors.textSecondary, fontSize: Typography.xs, lineHeight: 18 },
    section: { paddingHorizontal: Spacing.base, marginTop: Spacing.xl },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
    sectionTitle: { color: Colors.textPrimary, fontSize: Typography.md, fontWeight: '700', marginBottom: Spacing.sm },
    clearAll: { color: Colors.primary, fontSize: Typography.sm, fontWeight: '600' },
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    recentText: { flex: 1, color: Colors.textSecondary, fontSize: Typography.base },
    trendingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xs },
    trendChip: {
        backgroundColor: Colors.accentLight,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
    },
    trendChipText: { color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: '500' },
});
