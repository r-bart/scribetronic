---
name: style-refine
description: Propone deltas concretos a `scribetronic/style/writing-style.md` (la guía de voz personalizada del usuario) a partir del historial real de edición del usuario (draft vs publicado). No reescribe automáticamente — genera un documento de propuestas con evidencia textual obligatoria. Invocar tras 3+ piezas publicadas o cuando el usuario sienta drift de voz.
---

## Metadata

- **inherits**: `../writing-style/SKILL.md`

# style-refine

Cierra el loop entre lo que Claude redactó y lo que el usuario realmente publicó. Lee el historial de edición (draft → publicado), detecta patrones recurrentes, y propone deltas a `scribetronic/style/writing-style.md` (la guía personalizada del usuario, no el template del plugin). **No reescribe nada automáticamente.** Produce un documento de propuestas que el usuario revisa y aplica a mano.

Complementa a `style-extract`:
- `style-extract` **crea** la guía desde muestras externas + propias.
- `style-refine` **evoluciona** la guía usando ediciones reales del usuario.

## Regla principal

**Una propuesta de delta sin un par (draft → publicado) que la respalde no entra en el documento.** La evidencia es el diff real del usuario, no nuestra interpretación. Si solo tenemos un par que respalda un patrón, no lo proponemos — esperamos a que se repita.

Umbral mínimo: un delta requiere **≥2 pares distintos** mostrando el mismo patrón de edición.

## Inputs requeridos

Antes de empezar, comprobar y exigir:

1. **`scribetronic/style/writing-style.md` existente** en la raíz del proyecto. Si falta, parar y sugerir `scribetronic style` (para sembrar desde el template) o `/scribetronic:style-extract` (para generar desde muestras).
2. **≥3 pares (draft, published)** disponibles. Un par válido es:
   - Un draft en `scribetronic/calendar/<W>/newsletter.md` (o cualquier `.md` largo en una semana) que tenga `status: drafted` o `published` en su frontmatter.
   - Una versión publicada del mismo contenido en `scribetronic/published/` (mismo slug o título).
3. **Si <3 pares**: parar con mensaje amistoso. "Necesito al menos 3 piezas publicadas con su draft original conservado para detectar patrones reales. Tienes N. Vuelve cuando hayas publicado más."
4. **Si los pares son byte-identical** (sin ediciones): parar. "No detecto ediciones entre draft y publicado en N pares. O escribes en un solo intento o tu workflow no conserva el draft original. Sin diff no hay refinamiento."

## Workflow

### Fase 1 — Inventario

Listar todos los pares (draft, published) candidatos:

```
Pares encontrados (N):
1. 2026-W17/newsletter.md → published/2026-04-21-titulo-x.md
2. 2026-W18/newsletter.md → published/2026-04-28-titulo-y.md
3. ...
```

Si N < 3, abortar (ver Inputs requeridos).

### Fase 2 — Diffing

Para cada par, calcular las ediciones materiales (no whitespace, no frontmatter). Capturar literalmente:

- **Eliminaciones**: frase/párrafo/palabra que el usuario quitó.
- **Sustituciones**: A → B con ambos textos.
- **Adiciones**: frase/párrafo nuevo en publicado que no estaba en draft.
- **Reordenaciones**: párrafos movidos.

Ignorar:
- Cambios de typo evidente.
- Cambios de frontmatter (status, fecha, tags).
- Variaciones de espaciado/markdown.

Output intermedio (en memoria, no escribir): tabla de ediciones por par.

### Fase 3 — Clasificación

Agrupar las ediciones detectadas por dimensión, mapeando a las 8 secciones de `writing-style.md`:

| Dimensión | Ejemplos de patrón |
|---|---|
| 1. Voice & tone | "siempre suaviza afirmaciones tajantes" / "siempre quita el hedge" |
| 2. Structure | "siempre acorta el párrafo de cierre" / "siempre mueve la tesis al inicio" |
| 3. Sentence-level | "siempre rompe frases >25 palabras" / "siempre quita el adverbio inicial" |
| 4. Signature moves | "introduce una analogía concreta donde no la había" |
| 5. Anti-patterns | "elimina 'not just X but Y' que se nos coló" |
| Vocabulario | "sustituye `aprovechar` por `usar`" / "evita `aprovechar/aprovechamiento` consistentemente" |

Para cada agrupación, contar pares que la sustentan. Descartar agrupaciones con <2 pares.

### Fase 4 — Síntesis

Para las agrupaciones supervivientes, redactar deltas concretos. Cada delta tiene:

- **Tipo**: `add` (nueva regla), `modify` (ajustar regla existente), `remove` (regla obsoleta).
- **Sección afectada** de `writing-style.md` (1–8).
- **Evidence**: ≥2 fragmentos de pares mostrando draft → publicado lado a lado, citados textualmente.
- **Proposed change**: el bloque de markdown exacto que el usuario pegará si acepta.
- **Rationale**: 1–2 frases explicando el patrón.

### Fase 5 — Salida

Crear `scribetronic/style/refinements/YYYY-MM-DD.md` con la plantilla de abajo. Si el directorio no existe, crearlo. Si ya hay un archivo con la misma fecha, sufijar con `-N`.

Al final, imprimir al usuario:

```
Propuestas escritas a scribetronic/style/refinements/2026-05-03.md
N deltas propuestos basados en M pares analizados.

Para aplicarlos:
1. Abre el archivo y revisa cada delta.
2. Pega manualmente los que aceptes en scribetronic/style/writing-style.md.
3. Mueve este archivo a scribetronic/style/refinements/applied/ cuando termines.
```

## Plantilla de salida

```markdown
---
date: YYYY-MM-DD
base_version: <fecha o hash de writing-style.md analizado>
pairs_analyzed: N
status: proposed
---

# Style refinements — YYYY-MM-DD

## Summary

N propuestas: K aditivas, L modificaciones, M eliminaciones.

Pares analizados:
- 2026-W17/newsletter.md → published/2026-04-21-titulo-x.md
- 2026-W18/newsletter.md → published/2026-04-28-titulo-y.md
- 2026-W19/newsletter.md → published/2026-05-05-titulo-z.md

---

## Delta 1 — [sección afectada, p.ej. "5. Anti-patterns"]

**Type**: add
**Pairs supporting**: 3/N

### Evidence

**Par 1 (W17):**
- Draft: _"Esto no es solo una técnica, es una mentalidad."_
- Publicado: _"Esto es una mentalidad."_

**Par 2 (W18):**
- Draft: _"No solo escribimos newsletters, construimos relaciones."_
- Publicado: _"Construimos relaciones a través de la newsletter."_

**Par 3 (W19):**
- Draft: _"No es un hábito, es un sistema."_
- Publicado: _"Es un sistema."_

### Proposed change

Añadir a `scribetronic/style/writing-style.md` sección "5. Anti-patterns":

```
| "no es solo X, es Y" | suena AI, vacío, sobre-corregido | reescribir como afirmación directa: "es Y" |
```

### Rationale

El usuario elimina la construcción "no es solo X, es Y" en cada aparición. La regla ya existe en abstracto en la guía actual pero no como entrada en la tabla de anti-patterns. Hacerla explícita.

---

## Delta 2 — [sección afectada]

[mismo formato]

---

## Deltas descartados (registro)

Patrones detectados con <2 pares — no se proponen pero se registran para futura observación:

- "Quitar adverbio inicial 'realmente'" — 1 par. Esperar más datos.
- "Acortar cierres a una frase" — 1 par.
```

## Output

- Crear `scribetronic/style/refinements/YYYY-MM-DD.md` con `status: proposed`.
- Crear el directorio padre si no existe.
- No tocar `scribetronic/style/writing-style.md` bajo ningún concepto.
- Imprimir resumen + instrucciones de aplicación.

## Cuándo correr este skill

- **Disparador natural**: cada 3–5 piezas publicadas. Los orchestrators (`agenda`, `write-publish`) recordarán al usuario.
- **Disparador manual**: cuando el usuario sienta que su voz ha drifteado, o que `writing-style.md` ya no le representa.
- **Anti-disparador**: justo después de `style-extract`. La guía es nueva, no hay historial. Esperar a 3+ piezas publicadas con la guía nueva.

## Qué NO hacer

- **No reescribir `scribetronic/style/writing-style.md`.** Solo proponer.
- **No proponer deltas con <2 pares de evidencia.** Registrar como "patrón en observación", pero no proponer.
- **No inventar ediciones.** Si el draft y el publicado son idénticos, no hay datos.
- **No interpretar intención.** "El usuario quitó esta palabra" es un hecho. "El usuario probablemente prefiere X" es interpretación — solo permitida si ≥2 pares la respaldan textualmente.
- **No proponer cambios estructurales (estructura, voice, tono) basados en una sola pieza emocional o atípica.** Los outliers no son evidencia.
- **No tocar archivos fuera de `scribetronic/style/refinements/`.**
- **No correr en un repo sin `scribetronic/style/writing-style.md`.** Sugerir `style-extract` y abortar.
