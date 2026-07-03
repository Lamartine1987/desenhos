import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { LogIn, UserPlus } from 'lucide-react';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isProfessor, setIsProfessor] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login, registerUser } = useAppContext();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!phone || !password) return;

    let result = null;
    
    if (isRegistering) {
      if (!name) return;
      result = await registerUser(name, phone, password, isProfessor);
    } else {
      result = await login(phone, password);
    }

    if (result && result.success) {
      if (result.user.role === 'professor') {
        navigate('/professor');
      } else {
        navigate('/aluno');
      }
    } else if (result) {
      setErrorMsg(result.error);
    }
  };

  return (
    <div className="flex justify-center items-center h-full mt-12 mb-12">
      <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '3.5rem 3rem' }}>
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">{isRegistering ? 'Criar Conta' : 'Bem-vindo'}</h2>
          <p className="text-muted">
            {isRegistering ? 'Preencha seus dados para se cadastrar.' : 'Acesse a plataforma para enviar ou avaliar artes.'}
          </p>
        </div>

        {errorMsg && (
          <div style={{ background: '#fef2f2', color: '#ef4444', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid #f87171', textAlign: 'center', fontWeight: '500' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegistering && (
            <div className="input-group">
              <label className="input-label">Nome Completo</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Ex: João Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={isRegistering}
              />
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Telefone (Whatsapp)</label>
            <input 
              type="tel" 
              className="input-field" 
              placeholder="(00) 00000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          
          <div className="input-group mb-6">
            <label className="input-label">Senha</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isRegistering && (
            <div className="flex items-center gap-3 mb-8">
              <input 
                type="checkbox" 
                id="prof-check"
                checked={isProfessor}
                onChange={(e) => setIsProfessor(e.target.checked)}
                style={{ accentColor: 'var(--primary)', width: '1.2rem', height: '1.2rem' }}
              />
              <label htmlFor="prof-check" className="text-md cursor-pointer text-muted">
                Sou Professor
              </label>
            </div>
          )}

          <button type="submit" className="btn btn-primary w-full" style={{ padding: '1rem', fontSize: '1.1rem' }}>
            {isRegistering ? <UserPlus size={20} /> : <LogIn size={20} />}
            {isRegistering ? 'Cadastrar' : 'Entrar'}
          </button>
        </form>

        <div className="text-center mt-8">
          <button 
            className="text-primary hover:underline text-sm font-medium"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
            onClick={() => {
              setIsRegistering(!isRegistering);
              setName('');
              setPassword('');
              setPhone('');
            }}
          >
            {isRegistering ? 'Já tenho uma conta. Fazer login' : 'Não tem conta? Cadastre-se'}
          </button>
        </div>
      </div>
    </div>
  );
}
