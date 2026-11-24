import React from 'react';
import { AuthModal, AuthModalProps } from './AuthModal';

export interface EnhancedAuthModalProps extends AuthModalProps {
  onOpenSettings?: () => void;
}

export const EnhancedAuthModal: React.FC<EnhancedAuthModalProps> = (props) => {
  return <AuthModal {...props} />;
};

export default EnhancedAuthModal;
