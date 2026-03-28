import { Shield, Banknote, Truck, Lock } from 'lucide-react';
import { useLanguageStore } from '@/stores/language-store';
import { motion } from 'framer-motion';

const badgeColors = [
  'bg-primary/10',
  'bg-orange-100',
  'bg-primary/10',
  'bg-primary/10',
];

const iconBgColors = [
  'bg-primary/20',
  'bg-orange-200/60',
  'bg-primary/20',
  'bg-primary/20',
];

export function TrustBadges() {
  const { t } = useLanguageStore();

  const badges = [
    { icon: Shield, title: t('authenticProducts'), desc: t('authenticDesc') },
    { icon: Banknote, title: t('easyReturns'), desc: t('returnsDesc') },
    { icon: Truck, title: t('fastDelivery'), desc: t('deliveryDesc') },
    { icon: Lock, title: t('securePayment'), desc: t('secureDesc') },
  ];

  return (
    <section className="container-shop py-10">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {badges.map((badge, i) => (
          <motion.div
            key={badge.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08, ease: 'easeOut' }}
            className={`group relative rounded-2xl ${badgeColors[i]} p-5 sm:p-6 flex flex-col items-center text-center gap-3 overflow-hidden transition-all duration-300`}
          >
            {/* Icon circle */}
            <div className={`w-14 h-14 rounded-2xl ${iconBgColors[i]} flex items-center justify-center`}>
              <badge.icon className="h-6 w-6 text-primary" strokeWidth={1.8} />
            </div>

            {/* Text */}
            <div>
              <h3 className="font-bold text-sm sm:text-[15px] leading-tight text-foreground">{badge.title}</h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 leading-snug">{badge.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
