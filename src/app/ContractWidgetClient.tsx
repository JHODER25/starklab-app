'use client';

import { useState } from 'react';
import styles from './page.module.css';
import RewardModalClient from './RewardModalClient';

type Reward = {
  id: string;
  title: string;
  requiredXp: number;
  period: string;
};

type Props = {
  weeklyXp: number;
  monthlyXp: number;
  rewards: Reward[];
  dailyMaxXp: number;
  daysInMonth: number;
};

export default function ContractWidgetClient({ weeklyXp, monthlyXp, rewards, dailyMaxXp, daysInMonth }: Props) {
  const [period, setPeriod] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');

  const currentXp = period === 'WEEKLY' ? weeklyXp : monthlyXp;
  const filteredRewards = rewards.filter(r => r.period === period);

  const maxPeriodXp = period === 'WEEKLY' ? dailyMaxXp * 7 : dailyMaxXp * daysInMonth;

  const TIERS = [
    { id: 1, name: 'Botín Legendario', percent: 1, color: '#d946ef', shadow: '#d946ef' },
    { id: 2, name: 'Botín Épico', percent: 0.85, color: '#ff2a2a', shadow: '#ff2a2a' },
    { id: 3, name: 'Botín Raro', percent: 0.70, color: '#ff9900', shadow: '#ff9900' },
  ];

  return (
    <div className={`${styles.card} animate-fade-in`} style={{ animationDelay: "0.3s" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className={styles.cardHeader} style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
            CONTRATO {period === 'WEEKLY' ? 'SEMANAL' : 'MENSUAL'}
          </div>
          <RewardModalClient period={period} existingRewards={filteredRewards} />
        </div>
        
        {/* Toggle Slider */}
        <div style={{ 
          display: 'flex', 
          background: 'rgba(255,255,255,0.05)', 
          borderRadius: '20px', 
          padding: '2px',
          position: 'relative',
          cursor: 'pointer'
        }}>
          <div 
            onClick={() => setPeriod('WEEKLY')}
            style={{ 
              padding: '0.3rem 0.8rem', 
              fontSize: '0.7rem', 
              fontWeight: 'bold', 
              color: period === 'WEEKLY' ? 'white' : '#888',
              zIndex: 2,
              transition: 'color 0.3s'
            }}>
            SEM
          </div>
          <div 
            onClick={() => setPeriod('MONTHLY')}
            style={{ 
              padding: '0.3rem 0.8rem', 
              fontSize: '0.7rem', 
              fontWeight: 'bold', 
              color: period === 'MONTHLY' ? 'white' : '#888',
              zIndex: 2,
              transition: 'color 0.3s'
            }}>
            MES
          </div>
          <div style={{
            position: 'absolute',
            top: '2px',
            bottom: '2px',
            left: period === 'WEEKLY' ? '2px' : '50%',
            width: 'calc(50% - 2px)',
            background: '#ff3333',
            borderRadius: '18px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 1
          }} />
        </div>
      </div>
      
      <span style={{ color: '#888', fontSize: '0.8rem' }}>
        Recompensas calculadas sobre {maxPeriodXp} XP posibles este {period === 'WEEKLY' ? 'semana' : 'mes'}.
      </span>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        {TIERS.map((tier) => {
          const targetXp = Math.floor(maxPeriodXp * tier.percent);
          const isUnlocked = currentXp >= targetXp && targetXp > 0;
          const targetProgress = targetXp === 0 ? 0 : Math.min((Math.max(0, currentXp) / targetXp) * 100, 100);
          const userReward = filteredRewards.find(r => r.requiredXp === tier.id);
          const title = userReward ? userReward.title : 'Recompensa sin definir';

          return (
            <div key={tier.id} className={styles.contractMilestone}>
              <div className={styles.milestoneHeader}>
                <div>
                  <span style={{ color: tier.color, textShadow: `0 0 8px ${tier.shadow}`, fontWeight: 'bold', marginRight: '0.5rem' }}>[{tier.name}]</span>
                  <span style={{ color: isUnlocked ? 'white' : '#aaa' }}>{title}</span>
                </div>
                <span style={{ color: isUnlocked ? tier.color : '#888', textShadow: isUnlocked ? `0 0 5px ${tier.shadow}` : 'none', fontSize: '0.8rem' }}>
                  {currentXp} / {targetXp} XP
                </span>
              </div>
              <div className={styles.milestoneBarContainer} style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div 
                  className={styles.milestoneBar} 
                  style={{ 
                    width: `${targetProgress}%`, 
                    background: tier.color,
                    boxShadow: isUnlocked ? `0 0 15px ${tier.shadow}, 0 0 30px ${tier.shadow}` : `0 0 8px ${tier.shadow}80` 
                  }}>
                </div>
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
}
