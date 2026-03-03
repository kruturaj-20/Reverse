import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { Colors, Typography } from '../../theme';

type TextVariant = Extract<keyof typeof Typography, 'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl' | 'display'>;

interface CustomTextProps extends TextProps {
    variant?: TextVariant;
    color?: string;
    weight?: 'normal' | 'bold' | '500' | '600' | '700' | '800';
    align?: 'left' | 'center' | 'right';
}

export const CustomText: React.FC<CustomTextProps> = ({
    variant = 'base',
    color = Colors.textPrimary,
    weight = 'normal',
    align = 'left',
    style,
    children,
    ...rest
}) => {
    return (
        <Text
            style={[
                styles.text,
                {
                    fontSize: Typography[variant] as number,
                    color,
                    fontWeight: weight,
                    textAlign: align,
                },
                style,
            ]}
            {...rest}>
            {children}
        </Text>
    );
};

const styles = StyleSheet.create({
    text: {
        fontFamily: Typography.fontRegular,
    },
});
