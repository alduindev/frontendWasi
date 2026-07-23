const templates=new Map()
export function registerFormTemplate(template){if(!template?.key)throw new Error('El template requiere key');templates.set(template.key,template);return template}
export function getFormTemplate(key){const template=templates.get(key);if(!template)throw new Error(`Template no registrado: ${key}`);return template}
export function hasFormTemplate(key){return templates.has(key)}
