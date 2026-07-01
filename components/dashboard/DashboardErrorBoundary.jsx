import React from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, S, T } from '../../constants/onboarding-theme';
import PrimaryButton from '../ui/PrimaryButton';
import { reportClientError } from '../../lib/admin/reportError.js';

export default class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Dashboard render error:', error, info?.componentStack);
    reportClientError({
      severity: 'blocker',
      category: 'ui',
      message: error?.message || 'dashboard_render_error',
      stack: error?.stack,
      context: { componentStack: info?.componentStack?.slice?.(0, 500) },
    });
  }

  handleReset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    const { error } = this.state;
    const { children, title, body, retryLabel } = this.props;

    if (error) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: C.bg,
            alignItems: 'center',
            justifyContent: 'center',
            padding: S.pagePadH,
          }}
        >
          <Text style={{ ...T.questionTitle, fontSize: 22, textAlign: 'center', marginBottom: 12 }}>
            {title}
          </Text>
          <Text style={{ ...T.helper, textAlign: 'center', marginBottom: 24, maxWidth: 320 }}>
            {body}
          </Text>
          <PrimaryButton
            onPress={this.handleReset}
            fullWidth={false}
            style={{ alignSelf: 'center', minWidth: 168 }}
          >
            {retryLabel}
          </PrimaryButton>
        </View>
      );
    }

    return children;
  }
}
