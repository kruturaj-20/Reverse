import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';

interface Category {
    id: string;
    name: string;
    icon: string; // Emoji for demo, or URL
}

interface CategoryListProps {
    categories: Category[];
    onPress?: (category: Category) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({ categories, onPress }) => {
    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.title}>Category</Text>
                <TouchableOpacity>
                    <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.listContainer}>
                {categories.map((cat) => (
                    <TouchableOpacity
                        key={cat.id}
                        style={styles.categoryItem}
                        onPress={() => onPress?.(cat)}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.icon}>{cat.icon}</Text>
                        </View>
                        <Text style={styles.name}>{cat.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: Spacing.md,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.base,
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: Typography.lg,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    seeAll: {
        fontSize: Typography.sm,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    listContainer: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.base,
        justifyContent: 'space-between',
    },
    categoryItem: {
        alignItems: 'center',
        width: 65,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.accentLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    icon: {
        fontSize: 28,
        color: Colors.primary,
    },
    name: {
        fontSize: Typography.xs,
        color: Colors.textPrimary,
        fontWeight: '500',
        textAlign: 'center',
    },
});
