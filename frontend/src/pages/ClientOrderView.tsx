import { useState, type FormEvent } from 'react';
import api from '../services/api';
import { formatName } from '../utils/formatName';
import './ClientOrderView.css';

const getToday = () => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

export default function ClientOrderView() {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [address, setAddress] = useState('');
  const [quantityMembrillo, setQuantityMembrillo] = useState(0);
  const [quantityBatata, setQuantityBatata] = useState(0);
  const [deliveryDate, setDeliveryDate] = useState(getToday);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const totalTrays = quantityMembrillo + quantityBatata;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    if (address.trim().length < 3) {
      setErrorMessage('Poné una dirección correcta.');
      return;
    }

    if (totalTrays < 1) {
      setErrorMessage('Elegí al menos una bandeja para continuar.');
      return;
    }

    setSubmitting(true);
    const formattedName = formatName(clientName);
    try {
      await api.post('/orders', {
        clientName: formattedName,
        clientPhone,
        address: address.trim(),
        quantityMembrillo,
        quantityBatata,
        deliveryDate,
      });
      setClientName(formattedName);
      setSubmitted(true);
    } catch (error) {
      console.error('Error al enviar el pedido:', error);
      setErrorMessage('No pudimos registrar el pedido. Revisá tu conexión e intentá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setClientName('');
    setClientPhone('');
    setAddress('');
    setQuantityMembrillo(0);
    setQuantityBatata(0);
    setDeliveryDate(getToday());
    setSubmitted(false);
    setErrorMessage('');
  };

  if (submitted) {
    return (
      <main className="client-page client-success-page">
        <section className="client-success-card">
          <div className="client-success-icon" aria-hidden="true">✓</div>
          <p className="client-eyebrow">Glenbocky · Pastelería artesanal</p>
          <h1>¡Gracias, {clientName}!</h1>
          <p className="client-success-copy">Recibimos tu pedido. Ya estamos preparando algo rico para vos.</p>
          <button type="button" className="client-submit-button" onClick={resetForm}>
            Hacer otro pedido
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="client-page">
      <div className="client-order-layout">
        <section className="client-hero" aria-label="Pastelitos artesanales Glenbocky">
          <img
            className="client-hero-image"
            src="/pastelitos-portada.png"
            alt="Pastelitos de membrillo artesanales recién hechos"
          />
        </section>

        <section className="client-form-panel">
          <header className="client-form-heading">
            <p className="client-eyebrow client-tagline">LOS MEJORES DE BAHIA</p>
            <h2>Hacé tu pedido</h2>
            <p>Dejanos tus datos y armá tus bandejas favoritas.</p>
          </header>

          <form onSubmit={handleSubmit} className="client-order-form">
            {errorMessage && <div className="client-error" role="alert">{errorMessage}</div>}

            <div className="client-field">
              <label htmlFor="client-name">Nombre y apellido</label>
              <input
                id="client-name"
                autoComplete="name"
                placeholder="¿Cómo te llamás?"
                required
                maxLength={100}
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
              />
            </div>

            <div className="client-field">
              <label htmlFor="client-phone">Teléfono</label>
              <input
                id="client-phone"
                type="tel"
                autoComplete="tel"
                placeholder="Tu número de contacto"
                required
                maxLength={30}
                value={clientPhone}
                inputMode="numeric"
                onChange={(event) => setClientPhone(event.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div className="client-field">
              <label htmlFor="delivery-address">Dirección de entrega</label>
              <input
                id="delivery-address"
                autoComplete="street-address"
                placeholder="Calle y número"
                maxLength={200}
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
            </div>

            <fieldset className="client-flavors">
              <legend>Elegí tus gustos</legend>
              <p className="client-field-hint">Cada bandeja trae 6 pastelitos · $5000 c/u</p>
              <div className="client-flavor-grid">
                <div className="client-flavor-card client-flavor-membrillo">
                  <div className="client-flavor-heading">
                    <span className="client-flavor-dot" aria-hidden="true" />
                    <label htmlFor="quantity-membrillo">Membrillo</label>
                  </div>
                  <div className="client-quantity-control">
                    <button type="button" aria-label="Restar una bandeja de membrillo" disabled={quantityMembrillo === 0} onClick={() => setQuantityMembrillo((count) => Math.max(0, count - 1))}>−</button>
                    <input id="quantity-membrillo" type="number" min="0" max="50" value={quantityMembrillo} onChange={(event) => setQuantityMembrillo(Math.max(0, Math.min(50, Number(event.target.value))))} />
                    <button type="button" aria-label="Sumar una bandeja de membrillo" disabled={quantityMembrillo === 50} onClick={() => setQuantityMembrillo((count) => Math.min(50, count + 1))}>+</button>
                  </div>
                </div>
                <div className="client-flavor-card client-flavor-batata">
                  <div className="client-flavor-heading">
                    <span className="client-flavor-dot" aria-hidden="true" />
                    <label htmlFor="quantity-batata">Batata</label>
                  </div>
                  <div className="client-quantity-control">
                    <button type="button" aria-label="Restar una bandeja de batata" disabled={quantityBatata === 0} onClick={() => setQuantityBatata((count) => Math.max(0, count - 1))}>−</button>
                    <input id="quantity-batata" type="number" min="0" max="50" value={quantityBatata} onChange={(event) => setQuantityBatata(Math.max(0, Math.min(50, Number(event.target.value))))} />
                    <button type="button" aria-label="Sumar una bandeja de batata" disabled={quantityBatata === 50} onClick={() => setQuantityBatata((count) => Math.min(50, count + 1))}>+</button>
                  </div>
                </div>
              </div>
            </fieldset>

            <div className="client-field">
              <label htmlFor="delivery-date">Fecha deseada de entrega</label>
              <input
                id="delivery-date"
                className="client-date-input"
                type="date"
                min={getToday()}
                required
                value={deliveryDate}
                onChange={(event) => setDeliveryDate(event.target.value)}
              />
            </div>

            <div className="client-order-total" aria-live="polite">
              <span>Total de bandejas</span>
              <strong>{totalTrays}</strong>
            </div>

            <p className="client-form-footnote" style={{ fontSize: '12px', color: '#888' }}>
              Tus datos personales serán protegidos (Ley 25.326) y utilizados exclusivamente para la entrega de este pedido.
            </p>
            <button type="submit" className="client-submit-button" disabled={submitting || totalTrays === 0}>
              {submitting ? 'Enviando pedido…' : 'Confirmar pedido'}
              {!submitting && <span aria-hidden="true">→</span>}
            </button>
            <p className="client-form-footnote">Al confirmar, recibimos tu pedido para coordinar la entrega.</p>
          </form>
        </section>
      </div>
    </main>
  );
}
