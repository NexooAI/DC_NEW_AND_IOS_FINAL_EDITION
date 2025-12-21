import { FontAwesome } from '@expo/vector-icons';
import { ComponentProps } from 'react';

type IconName = ComponentProps<typeof FontAwesome>['name'];

const TabBarIcon = ({
  name,
  color,
  size = 24,
}: {
  name: IconName;
  color: string;
  size?: number;
}) => {
  return <FontAwesome name={name} size={size} color={color} />;
};

export default TabBarIcon