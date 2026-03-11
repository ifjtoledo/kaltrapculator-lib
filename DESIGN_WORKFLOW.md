# Design Workflow (solo estetica)

## Objetivo

Trabajar libremente la parte grafica (HTML/CSS) sin tocar el core de la libreria.

## Donde disenar

- `design-lab/index.html`
- `design-lab/lab.css`
- `design-lab/tokens.css`
- `design-lab/BRIEF_VISUAL.md`
- `design-lab/CHANGELOG_DESIGN.md`

Estos archivos no forman parte del API publico de la libreria.

## Como levantar el laboratorio

```bash
npm run design
```

Esto abre `http://localhost:5173/design-lab/` con hot reload.

## Reglas para no contaminar la libreria

- No editar `src/core/` durante fase de diseno.
- No meter logica JS en `design-lab/`.
- Tratar `design-lab/` como canvas artistico.
- No usar colores directos en `lab.css` si existe token equivalente.
- Registrar cada iteracion en `CHANGELOG_DESIGN.md`.

## Metodo recomendado por iteracion

1. Define la intencion visual en `BRIEF_VISUAL.md`.
2. Ajusta tokens en `tokens.css`.
3. Aplica composicion/estados en `lab.css`.
4. Documenta que funciono y que no en `CHANGELOG_DESIGN.md`.

## Cuando quieras migrar al componente

Pidele a Copilot: "traduce el diseno de `design-lab/` a `src/components/kaltrapculator-element.ts`".

Copilot hara esta acotacion:

1. Mover solo estilos y estructura HTML relevantes.
2. Convertir colores a CSS variables del `:host`.
3. Mantener intacta la API publica (`src/index.ts`, `src/register.ts`).
4. Evitar dependencia de estilos globales.

## Checklist de cierre estetico

- Composicion y jerarquia visual aprobadas.
- Responsive movil/desktop aceptable.
- Contraste y legibilidad correctos.
- Estados visuales clave definidos (normal, hover/active).
