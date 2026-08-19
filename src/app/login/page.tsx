import { login, signup } from './actions'
import styles from '../page.module.css'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const resolvedParams = await searchParams;
  return (
    <div className={styles.container}>
      {/* HUD Background Elements */}
      <div className={styles.hudBracketTopLeft}></div>
      <div className={styles.hudBracketTopRight}></div>
      <div className={styles.hudBracketBottomLeft}></div>
      <div className={styles.hudBracketBottomRight}></div>

      <main className={styles.main}>
        <div className="animate-fade-in" style={{ width: '100%' }}>
          <div className={styles.logoContainer}>
            <span className={styles.logoText}>S</span>
          </div>
          <div className={styles.attentionBadge}>
            <span>■</span> ACCESO REQUERIDO
          </div>
        </div>

        <header className={`${styles.header} animate-fade-in`} style={{ animationDelay: "0.1s" }}>
          <h1 className={styles.title}>IDENTIFICACIÓN</h1>
          <p className={styles.subtitle}>Ingresa tus credenciales para acceder al Sistema Starklab.</p>
        </header>

        {resolvedParams?.message && (
          <div style={{ background: 'rgba(255,0,0,0.2)', border: '1px solid #ff3333', color: '#ffaaaa', padding: '1rem', width: '100%', textAlign: 'center', marginBottom: '1rem', fontFamily: 'var(--font-orbitron)' }}>
            ERROR: {resolvedParams.message}
          </div>
        )}

        <section className={`${styles.habitModule} animate-fade-in`} style={{ animationDelay: "0.2s" }}>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="email" style={{ fontFamily: 'var(--font-orbitron)', fontSize: '0.8rem', color: '#ff3333', letterSpacing: '1px' }}>
                ID DE USUARIO (EMAIL)
              </label>
              <input 
                id="email" 
                name="email" 
                type="email" 
                required 
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,0,0,0.3)',
                  padding: '1rem',
                  color: 'white',
                  fontFamily: 'var(--font-inter)',
                  outline: 'none',
                  boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="password" style={{ fontFamily: 'var(--font-orbitron)', fontSize: '0.8rem', color: '#ff3333', letterSpacing: '1px' }}>
                CÓDIGO DE ACCESO (CONTRASEÑA)
              </label>
              <input 
                id="password" 
                name="password" 
                type="password" 
                required 
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,0,0,0.3)',
                  padding: '1rem',
                  color: 'white',
                  fontFamily: 'var(--font-inter)',
                  outline: 'none',
                  boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button formAction={login} className={styles.actionButton} style={{ flex: 1, padding: '1rem' }}>
                INGRESAR
              </button>
              <button formAction={signup} className={styles.actionButton} style={{ flex: 1, padding: '1rem', background: 'rgba(255,0,0,0.1)', border: '1px solid #ff3333', color: '#ff3333', clipPath: 'none' }}>
                REGISTRO
              </button>
            </div>
          </form>
        </section>
      </main>
      <div className={styles.bottomText}>SISTEMA STARKLAB V2.4</div>
    </div>
  )
}
