---
name: style-extract
description: Destila una guía de estilo de escritura desde 3-5 muestras de referencia y 1-2 textos propios. Genera `scribetronic/style/writing-style.md` con las 8 secciones (voice, structure, sentence-level, signature moves, anti-patterns, ejemplos +, ejemplos -, revision checklist). Usar cuando el usuario quiera crear o refrescar la guía de estilo de su blog/newsletter.
---

# style-extract

Destila una guía de estilo reutilizable a partir de muestras de escritura. La guía resultante alimenta a los skills de drafting (`newsletter-draft`, `blog-draft`) y de revisión (`editing-pass`, `ai-slop-check`).

Inspirado en la metodología de Every (8 secciones) y el patrón `style-creator` de haowjy/creative-writing-skills.

## Regla principal

**Una norma sin ejemplo textual no entra en la guía.** El valor está en los fragmentos literales — frases reales, aperturas reales, transiciones reales. Sin ellos, la guía degenera en "sé claro y auténtico" y no sirve para nada.

## Inputs requeridos

Antes de empezar, exigir al usuario:

1. **3-5 muestras de referencia** — newsletters/posts que admire. Links o pegados.
2. **1-2 textos propios representativos** — de los que diría "así quiero sonar".
3. **0-2 contraejemplos** (opcional pero recomendado) — "así NO quiero sonar".
4. **Contexto de alcance**:
   - Idioma principal (y si mezcla — p.ej. español con tecnicismos en inglés)
   - Formato objetivo (blog técnico, newsletter personal, ambos)
   - Audiencia (perfil, conocimiento previo asumido)
   - Frecuencia / longitud típica esperada

Si falta cualquiera de los 4 bloques, parar y pedirlo. No inventar.

## Workflow

### Fase 1 — Lectura cruda

Leer las 3-5 referencias + textos propios en una pasada, sin analizar. Solo capturar impresiones generales: qué se siente distinto, qué se repite, qué sorprende.

### Fase 2 — Análisis dimensional

Para cada muestra, extraer evidencia concreta (con cita textual) en estas dimensiones:

- **Tono**: temperatura emocional, nivel de formalidad, tensiones (¿conversacional + riguroso? ¿íntimo + analítico?)
- **Estructura**: cómo abre, cómo cierra, cómo pivota entre anécdota y argumento, cómo paginá las ideas
- **Frase**: longitud media y varianza, declarativas limpias vs acumulaciones, uso de puntuación rítmica (rayas, dos puntos, paréntesis)
- **Vocabulario**: concreto vs abstracto, técnico vs llano, presencia/ausencia de jerga, palabras-firma que se repiten
- **Movimientos firma**: técnicas recurrentes (anécdota → tesis, dato → reframe, lista → moraleja, pregunta retórica que se contesta a sí misma, etc.)
- **Red flags**: hedges ("creo que", "quizás"), correlativas vacías ("no X sino Y"), transiciones genéricas ("en resumen", "por otro lado"), adjetivos de relleno

### Fase 3 — Entrevista comparativa

NO pedir al usuario que se autodescriba. En su lugar, presentar **pares "genérico vs aterrizado"** construidos con sus propias muestras, y preguntar cuál resuena. Una pregunta a la vez. Ejemplos del tipo de comparación a usar:

- "Aquí abres con anécdota directa (ejemplo X). Aquí abres con tesis fría (ejemplo Y). ¿Cuál es tu default cuando dudas?"
- "Tus frases varían entre 6 y 35 palabras. ¿La frase corta-corta-corta-larga es algo consciente o accidente?"
- "Repites mucho `[palabra real]`. ¿Es firma o tic? Si es tic, ¿con qué la cambiamos?"

5-8 preguntas comparativas, no más. Si el usuario duda en una, registrarla como "sin decidir" en la guía.

### Fase 4 — Síntesis

Generar `scribetronic/style/writing-style.md` con la plantilla de 8 secciones (ver más abajo). Cada regla acompañada de **al menos un ejemplo textual real** extraído de las muestras. Para anti-patterns, incluir un fragmento real (puede ser AI-generated de muestra) con su corrección.

### Fase 5 — Validación

Pedir al usuario que lea la guía y marque:
- Reglas con las que no se identifica → eliminar o reformular.
- Ejemplos que no son representativos → reemplazar.
- Reglas que faltan → añadir.

Iterar hasta que el usuario diga "esto soy yo".

## Plantilla de salida (writing-style.md)

```markdown
---
created: {{fecha}}
sources:
  - referencias: [lista de URLs/títulos]
  - propias: [lista de URLs/títulos]
status: draft|validated
---

# Guía de estilo — {{nombre}}

## 1. Voice & tone
{{2-4 frases describiendo cómo se siente la escritura en su mejor momento. Tensiones concretas (no adjetivos sueltos).}}

**Ejemplo positivo:** _"[cita textual]"_ — por qué funciona.

## 2. Structure
- Aperturas preferidas: ...
- Cierres preferidos: ...
- Pivotes típicos: ...

**Ejemplo:** [referencia a muestra concreta + por qué]

## 3. Sentence-level
- Longitud objetivo y varianza
- Puntuación firma
- Conectores que sí / que no

**Ejemplo:** _"[cita]"_

## 4. Signature moves
1. **{{Nombre del movimiento}}** — qué es, cuándo usarlo. _Ejemplo: "[cita]"_
2. ...

## 5. Anti-patterns / blacklist
| Patrón | Por qué evitarlo | Cómo corregirlo |
|---|---|---|
| {{p.ej. "no es solo X, es Y"}} | suena a AI, vacío | reescribir como afirmación directa |
| ... | ... | ... |

## 6. Ejemplos positivos (3-5)
Cita + 1-2 frases de por qué representa la voz objetivo.

## 7. Ejemplos negativos (2-4)
Cita (real o sintética) + qué falla + reescritura aceptable.

## 8. Revision checklist
- [ ] ¿La apertura compromete en la primera frase?
- [ ] ¿Hay al menos un ejemplo concreto por argumento?
- [ ] ¿Las frases varían en longitud?
- [ ] ¿Cero hedges innecesarios?
- [ ] ¿Cero transiciones genéricas?
- [ ] ¿El cierre cierra (no sólo se detiene)?
- [ ] {{checks específicos del usuario}}
```

## Output

- Crear `scribetronic/style/writing-style.md` con `status: draft`.
- Mover muestras pegadas a `scribetronic/samples/` (una por archivo, prefijo `ref-` o `mine-` o `anti-`).
- Cuando el usuario valide, cambiar a `status: validated`.

## Qué NO hacer

- No describir el estilo en abstracto. Cada sección DEBE tener cita textual.
- No inventar ejemplos. Si falta evidencia para una dimensión, marcarlo como "sin datos suficientes".
- No copiar adjetivos genéricos del tipo "claro, conciso, auténtico" — si aparecen, reescribir con tensiones concretas.
- No ejecutar este skill sin las 3-5 muestras + 1-2 propias en mano. Parar y pedirlas.
