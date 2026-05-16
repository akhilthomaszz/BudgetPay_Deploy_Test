import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Wallet, ArrowRight, ShieldCheck, Zap } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export function LandingPage() {
  const { signIn } = useAuth();

  return (
    <View style={styles.container}>
      {/* Decorative Elements */}
      <View style={styles.headerBlur} />
      <View style={styles.footerBlur} />

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.iconBox}>
            <Wallet size={40} color="#1e3a8a" />
          </View>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            Budget<Text style={styles.titleHighlight}>Pay.</Text>
          </Text>
          <Text style={styles.subtitle}>
            Spend smarter. Save faster. {'\n'}The modern way to manage your UPI life.
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIconBox, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
               <ShieldCheck size={18} color="#4ade80" />
            </View>
            <Text style={styles.featureText}>Bank-grade security over your Firestore data.</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={[styles.featureIconBox, { backgroundColor: 'rgba(234, 179, 8, 0.2)' }]}>
               <Zap size={18} color="#facc15" />
            </View>
            <Text style={styles.featureText}>Real-time budget tracking on every scan.</Text>
          </View>
        </View>

        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={signIn}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Sign in with Google</Text>
          <ArrowRight size={20} color="#1e3a8a" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e3a8a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  headerBlur: {
    position: 'absolute',
    top: -height * 0.1,
    right: -width * 0.1,
    width: width * 0.8,
    height: width * 0.8,
    backgroundColor: 'rgba(30, 58, 138, 0.5)',
    borderRadius: 200,
  },
  footerBlur: {
    position: 'absolute',
    bottom: -height * 0.1,
    left: -width * 0.1,
    width: width * 0.6,
    height: width * 0.6,
    backgroundColor: 'rgba(20, 83, 45, 0.3)',
    borderRadius: 200,
  },
  content: {
    zIndex: 10,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  logoContainer: {
    marginBottom: 32,
  },
  iconBox: {
    width: 80,
    height: 80,
    backgroundColor: '#fff',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '12deg' }],
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    fontStyle: 'italic',
    letterSpacing: -1,
  },
  titleHighlight: {
    color: '#4ade80',
  },
  subtitle: {
    color: 'rgba(219, 234, 254, 0.8)',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
  featuresContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    opacity: 0.9,
  },
  button: {
    width: '100%',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 24,
    gap: 12,
    elevation: 8,
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  buttonText: {
    color: '#1e3a8a',
    fontSize: 18,
    fontWeight: '900',
  }
});
