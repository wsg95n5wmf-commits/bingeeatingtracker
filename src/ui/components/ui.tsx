import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './ui.module.css';

export function Card({ children, as: Tag = 'section' }: { children: ReactNode; as?: 'section' | 'div' | 'li' }) {
  return <Tag className={styles.card}>{children}</Tag>;
}

export function Stack({ children, tight = false }: { children: ReactNode; tight?: boolean }) {
  return <div className={tight ? styles.stackTight : styles.stack}>{children}</div>;
}

export function Row({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}

export function Spread({ children }: { children: ReactNode }) {
  return <div className={styles.spread}>{children}</div>;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'primary' | 'quiet' | 'danger';
  full?: boolean;
};

export function Button({ variant = 'default', full = false, className, ...rest }: ButtonProps) {
  const variants = {
    default: '',
    primary: styles.primary,
    quiet: styles.quiet,
    danger: styles.danger,
  } as const;
  const classes = [styles.button, variants[variant], full ? styles.full : '', className ?? '']
    .filter(Boolean)
    .join(' ');
  return <button type="button" className={classes} {...rest} />;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className={styles.label}>
      {label}
      {children}
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </label>
  );
}

/**
 * A pointer to where the user reads about this part of the program.
 * The app names the chapter; it does not explain it.
 */
export function ChapterTag({ chapter }: { chapter: string }) {
  return <span className={styles.chapter}>{chapter}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className={styles.empty}>{children}</p>;
}

export function Notice({ children }: { children: ReactNode }) {
  return <p className={styles.notice}>{children}</p>;
}

export function PageTitle({ title, aside }: { title: string; aside?: ReactNode }) {
  return (
    <header className={styles.pageTitle}>
      <h1>{title}</h1>
      {aside}
    </header>
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className={styles.hint}>{children}</p>;
}
