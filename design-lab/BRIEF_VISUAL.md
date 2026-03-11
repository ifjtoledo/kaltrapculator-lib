# Brief Visual - Kaltrapculator

## Vision

Calculadora con identidad ClapTrap: robusta, juguetona, tecnologica y legible.
La estetica debe sentirse "lista para usar" desde el primer render.

## Principios de diseno

- Silueta clara y reconocible.
- Contraste alto en datos criticos (pantalla y botones).
- Jerarquia visual simple: pantalla > operadores > numericos.
- Decoracion controlada: no saturar con efectos.

## Paleta oficial (v1)

- `--bg-1`: fondo profundo.
- `--bg-2`: degradado secundario.
- `--panel`: cuerpo del componente.
- `--clap-border`: contornos principales.
- `--clap-white`: superficies claras.
- `--clap-blue-eye`: acento principal.
- `--text`: texto general del escenario.
- `--op-accent`: acento para operadores.

## Tipografia

- Principal: `"Segoe UI", Roboto, Helvetica, Arial, sans-serif`.
- Pesos:
  - Titulos: 700.
  - Botones: 700.
  - Texto auxiliar: 400.

## Estados visuales minimos

- `default`: estado base.
- `hover`: leve elevacion o brillo.
- `active`: presion mecanica clara.
- `focus-visible`: anillo visible para accesibilidad.
- `disabled` (futuro): atenuado.

## Motion

- Duracion corta: `100ms-180ms`.
- Curva recomendada: `ease-out`.
- Usar motion solo para feedback funcional.

## Criterios de aceptacion por iteracion

- Coherencia visual mantenida.
- Legibilidad de pantalla en desktop y movil.
- Botones con feedback claro.
- No usar hex sueltos fuera de `tokens.css`.

## Regla de oro

Primero se actualiza `tokens.css`, luego `lab.css`.
No improvisar colores directamente en componentes finales.
