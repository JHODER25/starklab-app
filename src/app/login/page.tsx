import { login, signup } from './actions'
import styles from './login.module.css'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const resolvedParams = await searchParams;
  return (
    <div className={styles.wrapper}>
      <main className={styles.loginBox}>
        <div className="animate-fade-in" style={{ textAlign: 'center' }}>
          <div className={styles.logoContainer}>
            <div className={styles.logoIcon}>S</div>
          </div>
          <div className={styles.badge}>
            <span>■</span> ACCESO REQUERIDO
          </div>
        </div>

        <header className={`${styles.header} animate-fade-in`} style={{ animationDelay: "0.1s" }}>
          <h1 className={styles.title}>IDENTIFICACIÓN</h1>
          <p className={styles.subtitle}>Ingresa tus credenciales para acceder al Sistema Starklab.</p>
        </header>

        {resolvedParams?.message && (
          <div className={`${styles.errorMessage} animate-fade-in`}>
            ERROR: {resolvedParams.message}
          </div>
        )}

        <form 
          action={async (formData) => {
            'use server';
            await login(formData);
          }} 
          className="animate-fade-in" 
          style={{ animationDelay: "0.2s" }}
        >
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>
              ID DE USUARIO (EMAIL)
            </label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              className={styles.input}
              placeholder="agente@starklab.com"
              required 
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              CÓDIGO DE ACCESO (CONTRASEÑA)
            </label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              className={styles.input}
              placeholder="••••••••"
              required 
            />
          </div>

          <div className={styles.buttonContainer}>
            <button type="submit" className={styles.primaryButton}>
              INGRESAR AL SISTEMA
            </button>
            <button 
              formAction={async (formData) => {
                'use server';
                await signup(formData);
              }} 
              className={styles.secondaryButton}
            >
              SOLICITAR REGISTRO
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
