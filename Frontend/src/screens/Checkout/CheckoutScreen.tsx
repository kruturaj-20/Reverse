import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import RazorpayCheckout from 'react-native-razorpay';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { orderService } from '../../services/orders';

// ─── Validation Schema ────────────────────────────────────────────────────────

const shippingSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  street: z.string().min(5, 'Street address must be at least 5 characters'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z
    .string()
    .regex(/^\d{6}$/, 'Enter a valid 6-digit PIN code'),
});

type ShippingFormData = z.infer<typeof shippingSchema>;

// ─── Field Component ──────────────────────────────────────────────────────────

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'numeric';
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  error,
  placeholder,
  keyboardType = 'default',
}) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, error ? styles.inputError : undefined]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#9ca3af"
      keyboardType={keyboardType}
      autoCapitalize="words"
    />
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

const CheckoutScreen: React.FC = () => {
  const { items, clearCart } = useCartStore();
  const user = useAuthStore(state => state.user);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
  });

  const handleCheckout = async (formData: ShippingFormData) => {
    setLoading(true);
    try {
      const res = await orderService.checkout(formData);
      const { order, razorpay } = res.data;

      const options = {
        description: 'ReverseShop purchase',
        currency: razorpay.currency,
        key: razorpay.keyId,
        amount: razorpay.amount.toString(),
        order_id: razorpay.orderId,
        name: 'ReverseShop',
        prefill: {
          // Use the actual authenticated user's email — never a placeholder
          email: user?.email ?? '',
          contact: formData.phone,
          name: formData.fullName,
        },
        theme: { color: '#F37254' },
      } as any;

      const response = await RazorpayCheckout.open(options);

      // Verify payment BEFORE clearing the cart — if verification fails the cart is preserved
      await orderService.verifyPayment(
        order.id,
        response.razorpay_payment_id,
        response.razorpay_order_id,
        response.razorpay_signature,
      );

      // Only clear local cart state after successful server-side verification
      clearCart();
      Alert.alert('Success', 'Payment completed and order placed! 🎉');
    } catch (err: any) {
      // Razorpay returns a structured error object; other errors have .message
      const message =
        err?.code === 'PAYMENT_CANCELLED'
          ? 'Payment cancelled.'
          : err?.message || 'Something went wrong. Please try again.';
      Alert.alert('Payment failed', message);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Your cart is empty</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Shipping Address</Text>

        <Controller
          control={control}
          name="fullName"
          render={({ field: { value, onChange } }) => (
            <FormField
              label="Full Name"
              value={value}
              onChange={onChange}
              error={errors.fullName?.message}
              placeholder="Jane Doe"
            />
          )}
        />
        <Controller
          control={control}
          name="phone"
          render={({ field: { value, onChange } }) => (
            <FormField
              label="Phone Number"
              value={value}
              onChange={onChange}
              error={errors.phone?.message}
              placeholder="9876543210"
              keyboardType="phone-pad"
            />
          )}
        />
        <Controller
          control={control}
          name="street"
          render={({ field: { value, onChange } }) => (
            <FormField
              label="Street Address"
              value={value}
              onChange={onChange}
              error={errors.street?.message}
              placeholder="123, MG Road, Apt 4B"
            />
          )}
        />
        <Controller
          control={control}
          name="city"
          render={({ field: { value, onChange } }) => (
            <FormField
              label="City"
              value={value}
              onChange={onChange}
              error={errors.city?.message}
              placeholder="Bengaluru"
            />
          )}
        />
        <Controller
          control={control}
          name="state"
          render={({ field: { value, onChange } }) => (
            <FormField
              label="State"
              value={value}
              onChange={onChange}
              error={errors.state?.message}
              placeholder="Karnataka"
            />
          )}
        />
        <Controller
          control={control}
          name="zipCode"
          render={({ field: { value, onChange } }) => (
            <FormField
              label="PIN Code"
              value={value}
              onChange={onChange}
              error={errors.zipCode?.message}
              placeholder="560001"
              keyboardType="numeric"
            />
          )}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit(handleCheckout)}
          disabled={loading}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Pay with Razorpay"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Pay with Razorpay</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#F37254',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
});

export default CheckoutScreen;
