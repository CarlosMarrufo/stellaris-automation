import { useState } from 'react';
import { Users, Zap, Target, Boxes, User, Building2, Briefcase, Phone, Mail, MapPin } from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Técnicos Especializados',
    description: 'Soporte técnico especializado en mantenimiento, diagnóstico e integración.'
  },
  {
    icon: Zap,
    title: 'Respuesta Rápida',
    description: 'Atención prioritaria en contratos críticos e inventario local de refacciones para reducir tiempos de paro.'
  },
  {
    icon: Target,
    title: 'Enfoque en Uptime',
    description: 'Cada servicio está diseñado para maximizar disponibilidad y minimizar interrupciones productivas.'
  },
  {
    icon: Boxes,
    title: 'Multi-Marca',
    description: 'Acceso exclusivo a información de su flotilla: estado de cada robot, horas de operación, mantenimientos programados y seguimiento de tickets.'
  }
];

const serviceTypes = [
  { id: 'mantenimiento', label: 'Mantenimiento' },
  { id: 'diagnostico', label: 'Diagnóstico' },
  { id: 'refacciones', label: 'Refacciones' },
  { id: 'integracion', label: 'Integración / Proyecto' },
];

/** @type {{ nombre: string, empresa: string, cargo: string, telefono: string, correo: string, ciudad: string, servicios: string[], marcaRobot: string, numeroParte: string, modelo: string, descripcion: string }} */
const INITIAL_FORM = {
  nombre: '', empresa: '', cargo: '', telefono: '',
  correo: '', ciudad: '', servicios: [],
  marcaRobot: '', numeroParte: '', modelo: '', descripcion: '',
};

const inputClass = 'w-full bg-slate-800/70 border border-slate-600/60 rounded-lg py-2.5 px-3 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-400/70 focus:bg-slate-800 transition-colors';

export default function WhyChooseUs() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [status, setStatus] = useState('idle'); // idle | sending | success | error

  /** @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e */
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /** @param {string} id */
  const toggleServicio = (id) => {
    setFormData(prev => ({
      ...prev,
      servicios: prev.servicios.includes(id)
        ? prev.servicios.filter(s => s !== id)
        : [...prev.servicios, id],
    }));
  };

  /** @param {React.FormEvent<HTMLFormElement>} e */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const response = await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          nombre:      formData.nombre,
          empresa:     formData.empresa,
          cargo:       formData.cargo,
          telefono:    formData.telefono,
          correo:      formData.correo,
          ciudad:      formData.ciudad,
          servicios:   formData.servicios,
          marcaRobot:  formData.marcaRobot,
          numeroParte: formData.numeroParte,
          modelo:      formData.modelo,
          descripcion: formData.descripcion,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setStatus('success');
      setFormData(INITIAL_FORM);
    } catch {
      setStatus('error');
    }
  };

  return (
    <>
      {/* Features section */}
      <div className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Por qué elegirnos
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Somos el socio técnico para mantenimiento e integración de robots industriales, con enfoque en estabilidad operativa y crecimiento sostenible.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/30">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA + Contact Form Section */}
      <div
        className="py-14 text-white"
        style={{ background: 'linear-gradient(135deg, #1a0a3e 0%, #3d1478 35%, #9b3010 70%, #d4560a 100%)' }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold mb-3">
              ¿Robot detenido o en riesgo de falla?
            </h3>
            <p className="text-white/75 max-w-2xl mx-auto leading-relaxed">
              Contáctenos ahora. Nuestro equipo técnico evaluará su situación y le proporcionará
              una solución en el menor tiempo posible.
            </p>
          </div>

          {/* Form card */}
          <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-6 sm:p-8 shadow-2xl">
            <h4 className="text-white font-bold text-lg mb-5">Solicitar Atención Técnica</h4>

            {status === 'success' ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-emerald-400 font-semibold text-lg">¡Solicitud enviada correctamente!</p>
                <p className="text-slate-300 mt-2 text-sm">Nos pondremos en contacto a la brevedad.</p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-5 text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
                >
                  Enviar otra solicitud
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Row 1: Nombre, Empresa */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input className={inputClass + ' pl-10'} name="nombre" placeholder="Nombre completo" value={formData.nombre} onChange={handleChange} required />
                  </div>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input className={inputClass + ' pl-10'} name="empresa" placeholder="Empresa" value={formData.empresa} onChange={handleChange} />
                  </div>
                </div>

                {/* Row 2: Cargo, Teléfono */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input className={inputClass + ' pl-10'} name="cargo" placeholder="Cargo" value={formData.cargo} onChange={handleChange} />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input className={inputClass + ' pl-10'} name="telefono" placeholder="Teléfono" type="tel" value={formData.telefono} onChange={handleChange} />
                  </div>
                </div>

                {/* Row 3: Correo, Ciudad */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input className={inputClass + ' pl-10'} name="correo" placeholder="Correo electrónico" type="email" value={formData.correo} onChange={handleChange} required />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input className={inputClass + ' pl-10'} name="ciudad" placeholder="Ciudad" value={formData.ciudad} onChange={handleChange} />
                  </div>
                </div>

                {/* Tipo de servicio */}
                <div>
                  <p className="text-sm font-semibold text-white mb-2">Tipo de servicio</p>
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {serviceTypes.map(s => {
                      const checked = formData.servicios.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className="flex items-center gap-2 cursor-pointer select-none"
                          onClick={() => toggleServicio(s.id)}
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                              checked ? 'bg-emerald-600 border-emerald-600' : 'border-slate-500 bg-transparent'
                            }`}
                          >
                            {checked && (
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                              </svg>
                            )}
                          </div>
                          <span className={`text-sm transition-colors ${checked ? 'text-white font-semibold' : 'text-slate-300'}`}>
                            {s.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Información técnica */}
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-4 items-center">
                    <p className="text-sm font-semibold text-white">
                      Información técnica{' '}
                      <span className="text-slate-400 font-normal">(opcional pero recomendada)</span>
                    </p>
                    <input className={inputClass} name="marcaRobot" placeholder="Marca del robot" value={formData.marcaRobot} onChange={handleChange} />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <input className={inputClass} name="numeroParte" placeholder="Número de parte (si aplica)" value={formData.numeroParte} onChange={handleChange} />
                    <input className={inputClass} name="modelo" placeholder="Modelo" value={formData.modelo} onChange={handleChange} />
                  </div>

                  <textarea
                    name="descripcion"
                    placeholder="Descripción técnica del requerimiento"
                    value={formData.descripcion}
                    onChange={handleChange}
                    rows={3}
                    className={inputClass + ' resize-none'}
                  />
                </div>

                {/* Error */}
                {status === 'error' && (
                  <p className="text-red-400 text-sm">
                    Error al enviar. Por favor inténtelo de nuevo o llámenos directamente.
                  </p>
                )}

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <a
                    href="tel:+528183519650"
                    className="inline-flex items-center justify-center px-8 py-3 bg-white text-slate-900 rounded-xl hover:bg-slate-100 transition-colors font-semibold text-sm shadow-lg"
                  >
                    Llamar Ahora!
                  </a>
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="inline-flex items-center justify-center px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold text-sm shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {status === 'sending' ? 'Enviando...' : 'Enviar solicitud'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}