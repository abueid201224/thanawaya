import React from 'react';
import { AuthModal, AuthModalProps } from './AuthModal';

export interface EnhancedAuthModalProps extends AuthModalProps {
  onOpenSettings?: () => void;
}

export const EnhancedAuthModal: React.FC<EnhancedAuthModalProps> = ({
  onOpenSettings: _onOpenSettings,
  ...authProps
}) => {
  return <AuthModal {...authProps} />;
};

export default EnhancedAuthModal;
