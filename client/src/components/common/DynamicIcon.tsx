import React from 'react';
import { getIconComponent } from '../../lib/icons';

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
  color?: string;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({
  name,
  className = '',
  size = 20,
  color,
}) => {
  const Icon = getIconComponent(name);
  return <Icon className={className} size={size} color={color} />;
};
