import type { EquipmentType } from '@/lib/db';
import { EQUIPMENT_META } from '@/lib/equipment-meta';

type EquipmentIconProps = {
  type: EquipmentType;
  className?: string;
  imageClassName?: string;
};

export default function EquipmentIcon({ type, className, imageClassName }: EquipmentIconProps) {
  const icon = EQUIPMENT_META[type].icon;
  const isImage = icon.startsWith('/');

  if (isImage) {
    return (
      <img
        src={icon}
        alt={`${type.replaceAll('_', ' ')} icon`}
        className={imageClassName || className}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return <span className={className}>{icon}</span>;
}
