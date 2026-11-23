import { useEffect, useState } from 'react';

/**
 * Select cuyas opciones pueden venir de la API (campo.cargarOpciones) o ser estáticas (campo.opciones).
 * Se recargan cuando cambia campo.claveOpciones (por ejemplo, al elegir otro proveedor).
 */
function CampoSelect({ campo, valor, onChange, disabled }) {
    const [opciones, setOpciones] = useState(campo.opciones || []);
    const [cargando, setCargando] = useState(Boolean(campo.cargarOpciones));
    const clave = campo.claveOpciones ?? '';

    useEffect(() => {
        if (!campo.cargarOpciones) return undefined;
        // La bandera "activo" evita actualizar el estado si el componente se desmontó antes de que responda la API.
        let activo = true;
        setCargando(true);
        campo.cargarOpciones().then(data => { if (activo) setOpciones(data); }).catch(() => {}).finally(() => { if (activo) setCargando(false); });
        return () => { activo = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clave]);

    return (
        <select id={campo.name} name={campo.name} className="form-select" value={valor} onChange={onChange}
            required={campo.required} disabled={disabled || cargando}>
            <option value="">{cargando ? 'Cargando...' : 'Seleccione...'}</option>
            {opciones.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    );
}

// Estado inicial del formulario: checkbox en true (o su "defecto") y el resto vacío (o su "defecto").
const vacio = campos => Object.fromEntries(campos.map(c => [c.name, c.type === 'checkbox' ? (c.defecto ?? true) : (c.defecto ?? '')]));

// Deja únicamente los dígitos 0-9 de un texto (se usa en los campos con "soloNumeros", como el teléfono).
const soloDigitos = texto => String(texto ?? '').replace(/\D/g, '');

/**
 * Formulario controlado dirigido por una lista de campos; precarga valores al editar.
 * Tipos de campo soportados: text, email, number, select, textarea y checkbox.
 * Opciones por campo: required, maxLength, min, minExclusivo, step, soloCrear, soloNumeros, oculto(registro), ayuda, columnas.
 */
export default function FormEntidad({ titulo, campos, registro, aFormulario, aPayload, onSubmit, onCancel, saving }) {
    const [form, setForm] = useState(() => vacio(campos));
    const [validacion, setValidacion] = useState('');

    // Al cambiar el registro a editar (o al pasar a "crear") se rellena de nuevo el formulario.
    useEffect(() => {
        const base = vacio(campos);
        if (registro) {
            // aFormulario permite adaptar el registro de la API al formato del formulario (p. ej. ids de claves foráneas).
            const origen = aFormulario ? aFormulario(registro) : registro;
            campos.forEach(c => {
                const v = origen[c.name];
                base[c.name] = c.type === 'checkbox' ? Boolean(v) : (v ?? '');
            });
        }
        setForm(base);
        setValidacion('');
    }, [registro]); // eslint-disable-line react-hooks/exhaustive-deps

    // Manejador único de cambios: usa el atributo "name" del input para saber qué campo actualizar.
    const cambiar = evento => {
        const { name, type, value, checked } = evento.target;
        const campo = campos.find(c => c.name === name);
        // En los campos "soloNumeros" se descartan las letras y símbolos mientras la persona escribe o pega.
        const nuevo = type === 'checkbox' ? checked : (campo?.soloNumeros ? soloDigitos(value) : value);
        setForm(actual => ({ ...actual, [name]: nuevo }));
    };

    // Validación previa de experiencia de usuario; las reglas definitivas son las del servidor.
    const validar = () => {
        for (const c of campos) {
            if (c.oculto?.(registro)) continue;
            const v = form[c.name];
            if (c.required && c.type !== 'checkbox' && String(v).trim() === '') return `Complete el campo obligatorio: ${c.label}.`;
            if (c.type === 'email' && String(v).trim() && !/^\S+@\S+\.\S+$/.test(String(v).trim())) return `${c.label} no tiene un formato de correo válido.`;
            // Segunda barrera para "soloNumeros": cubre valores precargados al editar que traigan letras o guiones.
            if (c.soloNumeros && String(v).trim() && !/^\d+$/.test(String(v).trim())) return `${c.label} solo puede contener números.`;
            if (c.type === 'number' && v !== '' && Number.isNaN(Number(v))) return `${c.label} debe ser un número.`;
            if (c.type === 'number' && v !== '' && c.min !== undefined && Number(v) < Number(c.min)) return `${c.label} no puede ser menor que ${c.min}.`;
            if (c.type === 'number' && v !== '' && c.minExclusivo !== undefined && Number(v) <= Number(c.minExclusivo)) return `${c.label} debe ser mayor que ${c.minExclusivo}.`;
        }
        return '';
    };

    const enviar = async evento => {
        evento.preventDefault();
        const problema = validar();
        if (problema) { setValidacion(problema); return; }
        setValidacion('');
        // Se arma el payload para la API: números y selects vacíos viajan como null, los textos van sin espacios sobrantes.
        const payload = {};
        campos.forEach(c => {
            if (c.oculto?.(registro)) return;
            const v = form[c.name];
            if (c.type === 'checkbox') payload[c.name] = v;
            else if (c.type === 'number') payload[c.name] = v === '' ? null : v;
            else if (c.type === 'select') payload[c.name] = v === '' ? null : v;
            else payload[c.name] = typeof v === 'string' ? v.trim() : v;
        });
        // aPayload permite ajustar el cuerpo final (p. ej. agregar campos fijos como el id de la orden).
        const correcto = await onSubmit(aPayload ? aPayload(payload) : payload);
        // Si se creó un registro con éxito se limpia el formulario; al editar se cierra desde el panel.
        if (correcto && !registro) setForm(vacio(campos));
    };

    return (
        <section className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
                <h2 className="h5 fw-bold mb-3">{titulo}</h2>
                {validacion && <div role="alert" className="alert alert-warning py-2">{validacion}</div>}
                {/* noValidate: la validación la hace validar() para mostrar mensajes en español y con el mismo estilo. */}
                <form onSubmit={enviar} noValidate>
                    <div className="row g-3">
                        {campos.filter(c => !c.oculto?.(registro)).map(c => (
                            <div className={c.columnas || 'col-md-6'} key={c.name}>
                                {c.type === 'checkbox' ? (
                                    <div className="form-check mt-md-4">
                                        <input type="checkbox" id={c.name} name={c.name} className="form-check-input"
                                            checked={form[c.name]} onChange={cambiar} />
                                        <label className="form-check-label" htmlFor={c.name}>{c.label}</label>
                                    </div>
                                ) : (
                                    <>
                                        <label className="form-label" htmlFor={c.name}>{c.label}{c.required && ' *'}</label>
                                        {c.type === 'select' ? (
                                            <CampoSelect campo={c} valor={form[c.name]} onChange={cambiar}
                                                disabled={Boolean(registro && c.soloCrear)} />
                                        ) : c.type === 'textarea' ? (
                                            <textarea id={c.name} name={c.name} className="form-control" rows="2"
                                                value={form[c.name]} onChange={cambiar} maxLength={c.maxLength} />
                                        ) : (
                                            <input id={c.name} name={c.name} type={c.type || 'text'} className="form-control"
                                                value={form[c.name]} onChange={cambiar} maxLength={c.maxLength}
                                                inputMode={c.soloNumeros ? 'numeric' : undefined}
                                                min={c.min ?? c.minExclusivo} step={c.step}
                                                disabled={Boolean(registro && c.soloCrear)} />
                                        )}
                                        {c.ayuda && <div className="form-text">{c.ayuda}</div>}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="d-flex gap-2 mt-4">
                        <button type="submit" disabled={saving} className="btn btn-primary">
                            <i className="bi bi-save me-2" />
                            {saving ? 'Guardando...' : registro ? 'Guardar cambios' : 'Registrar'}
                        </button>
                        <button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={saving}>Cancelar</button>
                    </div>
                </form>
            </div>
        </section>
    );
}
