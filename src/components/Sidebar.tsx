'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from './Sidebar.module.css';
import { LayoutDashboard, Target, Wallet, UserCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

import { getRankInfo } from '@/utils/ranks';

export default function Sidebar({ userLevel = 1, userXp = 0 }: { userLevel?: number, userXp?: number }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (isCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
  }, [isCollapsed]);

  const links = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard, color: '#00f3ff' },
    { href: '/habits', label: 'Hábitos', icon: Target, color: '#ff1a1a' },
    { href: '/finance', label: 'Finanzas', icon: Wallet, color: '#10B981' },
    { href: '/profile', label: 'Perfil', icon: UserCircle2, color: '#b026ff' },
  ];

  const { currentRank, nextRank, progressPercent, xpInCurrentLevel, xpNeeded } = getRankInfo(userXp);

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      <button className={styles.toggleBtn} onClick={() => setIsCollapsed(!isCollapsed)}>
        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      <div className={styles.logoContainer}>
        <div className={styles.logoIcon}>S</div>
        <h2 className={styles.logoText}>Starklab</h2>
      </div>
      
      <nav className={styles.nav}>
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
              title={isCollapsed ? link.label : ''}
              style={isActive ? { background: `linear-gradient(90deg, ${link.color}25 0%, transparent 100%)` } : {}}
            >
              {isActive && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: link.color, boxShadow: `0 0 10px ${link.color}`, borderRadius: '0 4px 4px 0' }} />}
              <Icon 
                className={styles.icon} 
                strokeWidth={isActive ? 2.5 : 2} 
                style={isActive || isCollapsed ? { color: link.color, filter: `drop-shadow(0 0 5px ${link.color}99)` } : {}}
              />
              <span className={styles.navLabel}>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.userCard}>
        <div 
          className={styles.userAvatar} 
          style={{ 
            background: `${currentRank.color}15`, 
            border: `2px solid ${currentRank.color}`,
            boxShadow: `0 0 15px ${currentRank.color}40`,
            color: currentRank.color,
            textShadow: `0 0 5px ${currentRank.color}`
          }}
        >
          OP
        </div>
        <div className={styles.userInfo} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span className={styles.userName} style={{ fontSize: '0.9rem', lineHeight: '1' }}>Operador</span>
          <span className={styles.userRole} style={{ color: currentRank.color, fontWeight: 'bold', fontSize: '0.7rem', textTransform: 'uppercase', textShadow: `0 0 5px ${currentRank.color}`, letterSpacing: '1px' }}>
            {currentRank.name}
          </span>
          
          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
             <div style={{ width: `${progressPercent}%`, height: '100%', background: currentRank.color, boxShadow: `0 0 8px ${currentRank.color}`, transition: 'width 0.3s ease-out' }}></div>
          </div>
          <div style={{ fontSize: '0.65rem', color: '#aaa', marginTop: '2px', textAlign: 'right', fontFamily: 'var(--font-orbitron)' }}>
            {nextRank ? `${xpInCurrentLevel} / ${xpNeeded} XP` : 'NIVEL MÁXIMO'}
          </div>
        </div>
      </div>
    </aside>
  );
}
