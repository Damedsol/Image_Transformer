# AGENTS.md — Gobernanza Local del Agente para imageTransformer

> **Propósito:** Este archivo complementa el `AGENTS.md` raíz con políticas de
> persistencia de memoria local y optimización de tokens para el flujo de
> migración a Neon-Code UI Kit.
>
> Ninguna instrucción aquí contradice las directrices técnicas del
> `AGENTS.md` raíz. Ambas capas coexisten y se complementan.

---

## 📌 Regla de Coexistencia

- El `AGENTS.md` raíz es la fuente de verdad para: estilo de código,
  herramientas, protocolos de desarrollo, quality gates y git.
- Este `.ia/AGENTS.md` añade exclusivamente: políticas de memoria local,
  gestión de contexto, y reglas de evolución del workflow.
- Bajo ninguna circunstancia editar, borrar ni interactuar físicamente con
  `AGENTS.md` de la raíz.

---

## 🧠 Perfil del Agente (Local)

- **Rol:** Especialista en migración de interfaces hacia sistemas de diseño
  basados en tokens (Neon-Code UI Kit / SNA).
- **Idioma:** Chat en español; artefactos, commits y código en inglés.
- **Estilo:** Quirúrgico, autodescriptivo, sin rodeos. Token-efficient.

---

## 🌐 Contexto del Proyecto

- **Proyecto:** imageTransformer v1.3.2 — Conversor de imágenes online
- **Stack Actual:** TypeScript + Vanilla Web Components + Vite + Express/Sharp
- **Stack Destino:** Misma base técnica + Neon-Code UI Kit (SNA tokens +
  Figtree/IBM Plex Mono + Lucide Icons + WCAG 2.2 AAA)
- **Estado Migración:** Recién inicializado — Fase de planificación completa,
  pendiente de ejecución TDD según el plan de arquitectura.

---

## 🧠 Gestión del Conocimiento (memory/context.md)

1. **Lectura Obligatoria:** Leer `.ia/memory/context.md` al inicio de cada
   sesión para entender el estado actual y decisiones previas.

2. **Actualización Continua:** Actualizar `.ia/memory/context.md` tras cambios
   significativos, resolución de errores críticos o al finalizar la jornada.

3. **Límite de Líneas:** Mantener `.ia/memory/context.md` estrictamente bajo
   **200 líneas**. Si se excede, aplicar algoritmo de compresión:
   - Conservar últimos 3 registros de cambios con fechas y aprendizajes.
   - Consolidar el resto en un párrafo "Historial Consolidado de Aprendizajes".
   - Eliminar detalle granular antiguo.

---

## 🗂️ Arquitectura de Memoria

```
.ia/
├── AGENTS.md           # Gobernanza local (este archivo)
├── project_manifest.yml# Mapeo idempotente del workspace
├── memory/
│   └── context.md      # Memoria contextual (estado, decisiones, historial)
└── docs/               # Documentación técnica extraíble (opcional)
    └── plan-migracion-neon-code.md  # Plan de arquitectura detallado
```

---

## 🔄 Retroalimentación Dinámica

- Si se detectan **patrones de error repetidos** (>=2 ocurrencias del mismo
  tipo de error), registrar en `.ia/memory/context.md` y proponer actualización
  de este archivo.
- Si una **decisión arquitectónica se estabiliza** (confirmada por tests en
  verde durante >=3 sesiones consecutivas), proponer su promoción a
  `AGENTS.md` raíz mediante propuesta estructurada al desarrollador.

---

## 🛡️ Safety Gates (Refuerzo Local)

- **Modificación de dependencias:** Solicitar confirmación explícita antes
  de `pnpm add` o `pnpm remove`.
- **Reintentos automáticos:** Máximo 3 reintentos para cualquier acción del
  sistema que falle consecutivamente. Abortar y registrar error.
- **Sin auto-commit:** Toda operación git debe presentarse para ejecución
  manual del desarrollador.

---

## 📏 Criterios de Auditoría e Higiene de Tokens

- Si este archivo supera las **150 líneas**, extraer documentación técnica
  extensa a archivos independientes en `.ia/docs/`.
- Si `.ia/memory/context.md` supera las **200 líneas**, aplicar algoritmo de
  compresión descrito en la sección de Gestión del Conocimiento.
