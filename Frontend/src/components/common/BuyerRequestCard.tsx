import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';

interface BuyerRequestCardProps {
    title: string;
    budget: string | number;
    quotesReceived: number;
    timeRemaining: string;
    imageUrl?: string;
    onPress?: () => void;
    onFavoritePress?: () => void;
    isFavorite?: boolean;
}

export const BuyerRequestCard: React.FC<BuyerRequestCardProps> = ({
    title,
    budget,
    quotesReceived,
    timeRemaining,
    imageUrl,
    onPress,
    onFavoritePress,
    isFavorite = false,
}) => {
    return (
        <TouchableOpacity style={styles.container} activeOpacity={0.9} onPress={onPress}>
            <View style={styles.imageContainer}>
                {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
                ) : (
                    <View style={styles.placeholderImage}>
                        <Icon name="phone-portrait-outline" size={36} color={Colors.textMuted} />
                    </View>
                )}

                <TouchableOpacity style={styles.favoriteButton} onPress={onFavoritePress}>
                    <Icon
                        name={isFavorite ? 'heart' : 'heart-outline'}
                        size={16}
                        color={isFavorite ? Colors.error : Colors.textMuted}
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={2}>
                    {title}
                </Text>

                <View style={styles.infoRow}>
                    <View>
                        <Text style={styles.label}>Budget</Text>
                        <Text style={styles.price}>${budget}</Text>
                    </View>
                    <View style={styles.quotesBadge}>
                        <Text style={styles.quotesText}>{quotesReceived} Quotes</Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Icon name="time-outline" size={12} color={Colors.textMuted} style={styles.timeIcon} />
                    <Text style={styles.timeText}>{timeRemaining}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 165,
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.lg,
        padding: Spacing.sm,
        ...Shadows.md,
        marginRight: Spacing.md,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
    },
    imageContainer: {
        width: '100%',
        height: 120,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.accentLight,
        overflow: 'hidden',
        position: 'relative',
        marginBottom: Spacing.md,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    favoriteButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 30,
        height: 30,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.sm,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: Typography.sm,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
        lineHeight: 18,
        minHeight: 36,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: Spacing.sm,
    },
    label: {
        fontSize: 10,
        color: Colors.textMuted,
        fontWeight: '500',
        marginBottom: 2,
    },
    price: {
        fontSize: Typography.md,
        fontWeight: '800',
        color: Colors.primary,
    },
    quotesBadge: {
        backgroundColor: Colors.accent,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
    },
    quotesText: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.primaryDark,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: Colors.surfaceBorder,
        paddingTop: Spacing.sm,
    },
    timeIcon: {
        marginRight: 4,
    },
    timeText: {
        fontSize: 10,
        color: Colors.textSecondary,
        fontWeight: '500',
        flex: 1,
    },
});
