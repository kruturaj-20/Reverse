import React, { useState } from 'react';
import { View, Button, Text, StyleSheet, Alert } from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { useCartStore } from '../../store/cartStore';
import { orderService, OrderAddress } from '../../services/orders';

const CheckoutScreen: React.FC = () => {
  const { items, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // TODO: collect actual shipping address from a form
      const shippingAddress: OrderAddress = {
        fullName: 'John Doe',
        phone: '9999999999',
        street: '123 Main St',
        city: 'Metro City',
        state: 'State',
        zipCode: '123456',
      };

      const res = await orderService.checkout(shippingAddress);
      const { order, razorpay } = res.data;

      const options = {
        description: 'ReverseShop purchase',
        currency: razorpay.currency,
        key: razorpay.keyId,
        amount: razorpay.amount.toString(), // amount in paise
        order_id: razorpay.orderId,
        name: 'ReverseShop',
        prefill: {
          email: 'user@example.com',
          contact: shippingAddress.phone,
          name: shippingAddress.fullName,
        },
        theme: { color: '#F37254' },
      } as any;

      const response = await RazorpayCheckout.open(options);
      // response contains razorpay_payment_id, razorpay_order_id, razorpay_signature
      await orderService.verifyPayment(
        order.id,
        response.razorpay_payment_id,
        response.razorpay_order_id,
        response.razorpay_signature,
      );

      clearCart();
      Alert.alert('Success', 'Payment completed and order placed');
    } catch (err: any) {
      console.error('checkout error', err);
      Alert.alert('Payment failed', err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <Text>Your cart is empty</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Button
        title={loading ? 'Processing...' : 'Pay with Razorpay'}
        onPress={handleCheckout}
        disabled={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
});

export default CheckoutScreen;
