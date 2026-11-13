import { useEffect, useState, type CSSProperties } from 'react';
import { AxiosError } from 'axios';
import api from '../services/api';
import './AddressAutocomplete.css';

export interface AddressLocation {
  latitude: number;
  longitude: number;
}

interface AddressSuggestion extends AddressLocation {
  address: string;
}

interface AddressAutocompleteProps {
  id: string;
  value: string;
  onChange: (address: string) => void;
  onSelect: (location: AddressLocation | null) => void;
  inputStyle?: CSSProperties;
  className?: string;
}

export default function AddressAutocomplete({
  id,
  value,
  onChange,
  onSelect,
  inputStyle,
  className,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');

  useEffect(() => {
    const query = value.trim();
    if (query.length < 3 || query === selectedAddress) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const response = await api.get<AddressSuggestion[]>('/addresses/suggestions', {
          params: { text: query },
          signal: controller.signal,
        });
        setSuggestions(response.data);
        setIsOpen(true);
      } catch (error) {
        if (!controller.signal.aborted) {
          const message = error instanceof AxiosError ? error.response?.data?.message : undefined;
          setErrorMessage(typeof message === 'string' ? message : 'No se pudieron buscar direcciones.');
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 500);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [selectedAddress, value]);

  const handleChange = (nextValue: string) => {
    setSelectedAddress('');
    setSuggestions([]);
    setErrorMessage('');
    setIsLoading(false);
    onChange(nextValue);
    onSelect(null);
    setIsOpen(true);
  };

  const handleSelect = (suggestion: AddressSuggestion) => {
    setSelectedAddress(suggestion.address);
    onChange(suggestion.address);
    onSelect({ latitude: suggestion.latitude, longitude: suggestion.longitude });
    setSuggestions([]);
    setIsOpen(false);
    setErrorMessage('');
  };

  return (
    <div className={`address-autocomplete ${className ?? ''}`}>
      <input
        id={id}
        autoComplete="off"
        placeholder="Calle, número, ciudad y país"
        required
        maxLength={200}
        value={value}
        style={inputStyle}
        aria-autocomplete="list"
        aria-controls={`${id}-suggestions`}
        aria-expanded={isOpen && suggestions.length > 0}
        onChange={(event) => handleChange(event.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => window.setTimeout(() => setIsOpen(false), 150)}
      />
      {isOpen && (suggestions.length > 0 || isLoading || errorMessage) && (
        <ul id={`${id}-suggestions`} className="address-suggestions" role="listbox">
          {suggestions.map((suggestion) => (
            <li key={`${suggestion.latitude},${suggestion.longitude},${suggestion.address}`} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={false}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(suggestion)}
              >
                {suggestion.address}
              </button>
            </li>
          ))}
          {isLoading && <li className="address-suggestions-status">Buscando direcciones…</li>}
          {errorMessage && <li className="address-suggestions-error" role="alert">{errorMessage}</li>}
        </ul>
      )}
    </div>
  );
}
