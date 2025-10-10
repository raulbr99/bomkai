# Configuración para Vercel

## Variables de Entorno Requeridas

Para que la aplicación funcione correctamente en Vercel, necesitas configurar la siguiente variable de entorno:

### 1. NEXT_PUBLIC_ANTHROPIC_API_KEY

1. Ve a tu proyecto en Vercel Dashboard
2. Navega a **Settings** → **Environment Variables**
3. Añade una nueva variable:
   - **Name**: `NEXT_PUBLIC_ANTHROPIC_API_KEY`
   - **Value**: Tu API key de Anthropic (comienza con `sk-ant-`)
   - **Environment**: Selecciona `Production`, `Preview`, y `Development`

4. Haz clic en **Save**
5. **Importante**: Redeploy tu aplicación para que los cambios tomen efecto

### Obtener una API Key de Anthropic

1. Ve a [console.anthropic.com](https://console.anthropic.com/)
2. Inicia sesión o crea una cuenta
3. Navega a **API Keys**
4. Haz clic en **Create Key**
5. Copia la key (empieza con `sk-ant-`)
6. **Guárdala de forma segura** - no la compartas públicamente

## Configuración de Funciones Serverless

Para evitar timeouts en Vercel, necesitas ajustar la configuración de tiempo máximo de ejecución:

### vercel.json (opcional)

Crea un archivo `vercel.json` en la raíz del proyecto:

```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

**Nota**: El límite de 60 segundos solo está disponible en planes Pro de Vercel. En el plan gratuito, el límite es de 10 segundos.

## Solución de Problemas

### Error: "Internal server error" de Anthropic

**Causas posibles:**

1. **API Key incorrecta o no configurada**
   - Verifica que `NEXT_PUBLIC_ANTHROPIC_API_KEY` esté configurada en Vercel
   - Asegúrate de que la key comience con `sk-ant-`
   - Redeploy después de agregar la variable

2. **Modelo no disponible**
   - Estamos usando `claude-sonnet-4-20250514` con streaming (`stream: true`)
   - Verifica que tu cuenta tenga acceso a este modelo
   - Si tienes problemas, puedes cambiar al modelo `claude-3-5-sonnet-20241022` que es más antiguo pero más estable

3. **Rate limiting**
   - Anthropic tiene límites de requests por minuto
   - Para producción, considera implementar colas o throttling

4. **Timeout en Vercel**
   - En el plan gratuito, las funciones tienen límite de 10 segundos
   - Considera actualizar a plan Pro para 60 segundos
   - O reduce el `max_tokens` en los endpoints API

### Error: "ANTHROPIC_API_KEY no está configurada"

1. Ve a Vercel Dashboard → Settings → Environment Variables
2. Verifica que `NEXT_PUBLIC_ANTHROPIC_API_KEY` existe
3. Asegúrate de haberla añadido para el entorno correcto (Production/Preview)
4. Redeploy la aplicación

### Logs para Debugging

Para ver los logs en Vercel:

1. Ve a tu proyecto en Vercel Dashboard
2. Navega a **Deployments**
3. Haz clic en el deployment actual
4. Ve a la pestaña **Functions**
5. Haz clic en cualquier función para ver sus logs

## Limitaciones del Plan Gratuito de Vercel

- **Timeout**: 10 segundos máximo por función
- **Memoria**: 1024 MB
- **Invocaciones**: 100,000 por mes

Para generar libros largos (muchos capítulos), considera:
- Actualizar a Vercel Pro ($20/mes) para 60s timeout
- Reducir el número de capítulos por generación
- Implementar una cola de procesamiento en background

## Monitoreo de Costos de Anthropic

Para un libro de 5 capítulos:
- Costo estimado: ~$0.25 - $0.50 USD
- Esto incluye outline + generación de capítulos

Para un libro de 20 capítulos:
- Costo estimado: ~$1.00 - $2.00 USD

Monitorea tu uso en [console.anthropic.com](https://console.anthropic.com/) → **Usage**

## Deployment Checklist

Antes de hacer deploy a Vercel:

- [ ] Variable `NEXT_PUBLIC_ANTHROPIC_API_KEY` configurada
- [ ] API key verificada en Anthropic Console
- [ ] `vercel.json` creado (si necesitas más de 10s timeout)
- [ ] Build local exitoso (`npm run build`)
- [ ] Todas las dependencias instaladas en `package.json`
- [ ] `.env.example` actualizado para referencia

## Comandos Útiles

```bash
# Build local para verificar
npm run build

# Verificar variables de entorno localmente
vercel env pull

# Deploy a preview
vercel

# Deploy a producción
vercel --prod
```

## Soporte

Si tienes problemas:
1. Revisa los logs en Vercel Dashboard
2. Verifica que la API key sea válida en Anthropic Console
3. Asegúrate de tener créditos disponibles en tu cuenta de Anthropic
4. Revisa el límite de rate limiting en tu plan de Anthropic
