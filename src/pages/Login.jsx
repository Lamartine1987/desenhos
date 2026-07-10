import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { LogIn, UserPlus, Info } from 'lucide-react';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login, registerUser, resetPassword, user } = useAppContext();
  const navigate = useNavigate();
  const [showForgotModal, setShowForgotModal] = useState(false);

  React.useEffect(() => {
    if (user) {
      if (user.role === 'professor') {
        navigate('/professor');
      } else {
        navigate('/aluno');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (isRegistering) {
      if (!name || !email || !phone || !password) return;
      const result = await registerUser(name, email, phone, password);
      if (result && result.success) {
        navigate('/aluno');
      } else if (result) {
        setErrorMsg(result.error);
      }
    } else {
      if (!email || !password) return;
      const result = await login(email, password);
      if (result && result.success) {
        if (result.user.role === 'professor') {
          navigate('/professor');
        } else {
          navigate('/aluno');
        }
      } else if (result) {
        setErrorMsg(result.error);
      }
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!resetEmail) return;
    setErrorMsg('');
    const result = await resetPassword(resetEmail);
    if (result.success) {
      setResetSuccess(true);
    } else {
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
            <label className="input-label">E-mail</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {isRegistering && (
            <div className="input-group">
              <label className="input-label">Telefone (Whatsapp)</label>
              <input 
                type="tel" 
                className="input-field" 
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required={isRegistering}
              />
            </div>
          )}
          
          <div className="input-group mb-2">
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

          {!isRegistering && (
            <div className="mb-6" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button"
                onClick={() => setShowForgotModal(true)}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'var(--primary)', 
                  cursor: 'pointer', 
                  fontSize: '0.875rem', 
                  fontWeight: '500',
                  outline: 'none',
                  padding: '0'
                }}
              >
                Esqueci minha senha
              </button>
            </div>
          )}
          
          {isRegistering && <div className="mb-6"></div>}



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

      {showForgotModal && (
        <div 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100
          }}
        >
          <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <div className="flex justify-center mb-4 text-primary">
              <Info size={48} />
            </div>
            <h3 className="text-xl font-bold mb-4">Recuperação de Senha</h3>
            
            {resetSuccess ? (
              <>
                <p className="text-success mb-8 leading-relaxed font-medium">
                  E-mail de recuperação enviado com sucesso! Verifique sua caixa de entrada e spam.
                </p>
                <button 
                  className="btn btn-primary w-full justify-center" 
                  onClick={() => {
                    setShowForgotModal(false);
                    setResetSuccess(false);
                  }}
                >
                  Voltar ao Login
                </button>
              </>
            ) : (
              <>
                <p className="text-muted mb-6 leading-relaxed">
                  Digite seu e-mail de cadastro. Enviaremos um link para você redefinir sua senha com segurança.
                  <span style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: '8px', display: 'block', fontWeight: '500' }}>
                    ⚠️ Importante: O e-mail pode cair na sua pasta de Lixo Eletrônico ou Spam.
                  </span>
                </p>
                <form onSubmit={handleResetSubmit}>
                  <div className="input-group mb-6 text-left">
                    <label className="input-label">E-mail Cadastrado</label>
                    <input 
                      type="email" 
                      className="input-field" 
                      placeholder="seu@email.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    <button type="submit" className="btn btn-primary w-full justify-center">
                      Enviar link de recuperação
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-outline w-full justify-center" 
                      onClick={() => setShowForgotModal(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
