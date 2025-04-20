import fs from 'fs';
import path from 'path';

export interface AuditLogEntry {
  timestamp: string;
  ip: string;
  action: string;
  details: Record<string, unknown>;
}

/**
 * Clase para el registro de eventos de auditoría
 */
export class AuditLogger {
  private logPath: string;
  private enabled: boolean;

  /**
   * Constructor del logger de auditoría
   * @param logDir Directorio donde se guardarán los logs de auditoría
   */
  constructor(logDir: string = path.join(__dirname, '../../logs')) {
    this.enabled = process.env.ENABLE_AUDIT_LOG === 'true';

    // Si no está habilitado, no crear directorios
    if (!this.enabled) {
      this.logPath = '';
      return;
    }

    // Crear directorio si no existe
    if (!fs.existsSync(logDir)) {
      try {
        fs.mkdirSync(logDir, { recursive: true });
      } catch (error) {
        this.enabled = false;
        this.logPath = '';
        return;
      }
    }

    this.logPath = path.join(logDir, `audit-${new Date().toISOString().split('T')[0]}.log`);
  }

  /**
   * Registra un evento de auditoría
   * @param entry Datos del evento a registrar
   */
  public log(entry: Omit<AuditLogEntry, 'timestamp'>): void {
    // Si el registro de auditoría está deshabilitado, no hacer nada
    if (!this.enabled) {
      return;
    }

    const logEntry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      ...entry,
    };

    try {
      fs.appendFileSync(this.logPath, JSON.stringify(logEntry) + '\n', { encoding: 'utf8' });
    } catch (error) {
      // Error silenciado intencionalmente
    }
  }
}

// Instancia singleton para usar en toda la aplicación
export const auditLogger = new AuditLogger();
