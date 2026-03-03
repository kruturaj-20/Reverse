import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';

interface FilterSearchBarProps {
    placeholder?: string;
    onSearch?: (text: string) => void;
    onFilterPress?: () => void;
}

export const FilterSearchBar: React.FC<FilterSearchBarProps> = ({
    placeholder = 'Search Buyer Requests...',
    onSearch,
    onFilterPress,
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.inputContainer}>
                <Icon name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor={Colors.textMuted}
                    onChangeText={onSearch}
                />
            </View>
            <TouchableOpacity style={styles.filterButton} onPress={onFilterPress} activeOpacity={0.8}>
                <Icon name="options-outline" size={20} color={Colors.white} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.base,
        marginVertical: Spacing.sm,
        gap: Spacing.sm,
    },
    inputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.accentLight,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.md,
        height: 50,
    },
    searchIcon: {
        marginRight: Spacing.xs,
    },
    input: {
        flex: 1,
        color: Colors.textPrimary,
        fontSize: Typography.base,
        fontWeight: '500',
    },
    filterButton: {
        backgroundColor: Colors.primary,
        width: 50,
        height: 50,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
