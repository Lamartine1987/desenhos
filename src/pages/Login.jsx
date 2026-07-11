import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { LogIn, UserPlus, Info, FileText, X } from 'lucide-react';

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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [modalType, setModalType] = useState('terms');

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
      if (!acceptedTerms || !acceptedPrivacy) {
        setErrorMsg('Você precisa aceitar os Termos de Uso e a Política de Privacidade (LGPD) para se cadastrar.');
        return;
      }
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
                name="name"
                className="input-field" 
                placeholder="Ex: João Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={isRegistering}
                autoComplete="name"
                autoCapitalize="words"
              />
            </div>
          )}

          <div className="input-group">
            <label className="input-label">E-mail</label>
            <input 
              type="email" 
              name="email"
              className="input-field" 
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>

          {isRegistering && (
            <div className="input-group">
              <label className="input-label">Telefone (Whatsapp)</label>
              <input 
                type="tel" 
                name="phone"
                className="input-field" 
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required={isRegistering}
                autoComplete="tel"
              />
            </div>
          )}
          
          <div className="input-group mb-2">
            <label className="input-label">Senha</label>
            <input 
              type="password" 
              name="password"
              className="input-field" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
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
          
          {isRegistering && (
            <div className="mb-6 flex flex-col gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
              <div className="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  id="terms" 
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1"
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                  required
                />
                <label htmlFor="terms" className="text-sm text-muted leading-relaxed cursor-pointer select-none">
                  Li e concordo com os <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setModalType('terms'); setShowTermsModal(true); }} className="text-primary hover:underline" style={{background:'none', border:'none', padding:0, cursor:'pointer', fontWeight: '600'}}>Termos de Uso</button>.
                </label>
              </div>

              <div className="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  id="privacy" 
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                  className="mt-1"
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                  required
                />
                <label htmlFor="privacy" className="text-sm text-muted leading-relaxed cursor-pointer select-none">
                  Li e concordo com a <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setModalType('privacy'); setShowTermsModal(true); }} className="text-primary hover:underline" style={{background:'none', border:'none', padding:0, cursor:'pointer', fontWeight: '600'}}>Política de Privacidade (LGPD)</button>.
                </label>
              </div>
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
              setAcceptedTerms(false);
              setAcceptedPrivacy(false);
              setErrorMsg('');
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
                      name="reset-email"
                      className="input-field" 
                      placeholder="seu@email.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      autoComplete="email"
                      autoCapitalize="none"
                      autoCorrect="off"
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

      {showTermsModal && (
        <div 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            zIndex: 100
          }}
        >
          <div className="glass-panel flex flex-col" style={{ width: '100%', maxWidth: '700px', maxHeight: '85vh', position: 'relative', overflow: 'hidden' }}>
            <div className="flex justify-between items-center" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-2">
                <FileText className="text-primary" size={24} />
                <h3 className="text-xl font-bold">{modalType === 'terms' ? 'Termos de Uso' : 'Política de Privacidade (LGPD)'}</h3>
              </div>
              <button 
                onClick={() => setShowTermsModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>
            
            <div style={{ padding: '1.5rem', fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.6', overflowY: 'auto', flex: '1 1 auto', minHeight: 0 }}>
              {modalType === 'terms' ? (
                <>
                  <div className="mb-6">
                    <p><strong>ArtReview</strong></p>
                    <p><strong>Versão:</strong> 1.0</p>
                    <p><strong>Data de Vigência:</strong> 11 de julho de 2026</p>
                    <p className="text-sm text-primary mt-1"><em>Observação: personalize os campos entre colchetes antes da publicação.</em></p>
                  </div>

                  <h4 className="font-bold text-main mb-2">1. Apresentação</h4>
                  <p className="mb-4">A ArtReview é uma plataforma desenvolvida pela LamaTech para apoiar professores na gestão de avaliações de desenhos enviados por seus alunos.</p>
                  <p className="mb-6">A plataforma permite o cadastro de usuários, envio de desenhos, acompanhamento das avaliações e organização das atividades do curso. Os vídeos de correção são gravados e publicados diretamente pelo professor em plataforma de sua escolha. A ArtReview não hospeda esses vídeos nem realiza integração automática com plataformas de terceiros.</p>

                  <h4 className="font-bold text-main mb-2">2. Aceitação dos Termos</h4>
                  <p className="mb-6">Ao criar uma conta e utilizar a ArtReview, o usuário declara que leu, compreendeu e concorda com estes Termos de Uso e com a Política de Privacidade.</p>

                  <h4 className="font-bold text-main mb-2">3. Cadastro e Conta</h4>
                  <p className="mb-6">O usuário deverá fornecer nome, e-mail, telefone e criar uma senha. É responsável pela veracidade das informações e pelo sigilo de suas credenciais de acesso.</p>

                  <h4 className="font-bold text-main mb-2">4. Utilização da Plataforma</h4>
                  <p className="mb-6">O usuário compromete-se a utilizar a plataforma de forma ética e conforme a legislação, abstendo-se de praticar atos ilícitos, tentar obter acesso indevido, enviar arquivos maliciosos ou violar direitos de terceiros.</p>

                  <h4 className="font-bold text-main mb-2">5. Envio de Desenhos</h4>
                  <p className="mb-4">O aluno declara ser titular dos direitos sobre os desenhos enviados ou possuir autorização para utilizá-los.</p>
                  <p className="mb-6">Conteúdos ilícitos ou que violem direitos de terceiros poderão ser removidos.</p>

                  <h4 className="font-bold text-main mb-2">6. Direitos Autorais</h4>
                  <p className="mb-4">Os desenhos permanecem de propriedade do aluno.</p>
                  <p className="mb-4">Ao enviar um desenho, o aluno concede ao professor responsável e à ArtReview licença limitada, gratuita e não exclusiva para armazenar, visualizar e utilizar o material exclusivamente para fins de avaliação pedagógica e funcionamento da plataforma.</p>
                  <p className="mb-6">A LamaTech não utilizará os desenhos para fins comerciais ou publicitários.</p>

                  <h4 className="font-bold text-main mb-2">7. Responsabilidades</h4>
                  <ul className="mb-6 list-disc pl-5">
                    <li className="mb-2"><strong>Do aluno:</strong> manter dados atualizados, preservar a segurança da conta e respeitar estes Termos.</li>
                    <li className="mb-2"><strong>Do professor:</strong> conduzir as avaliações, administrar o curso e publicar os vídeos de correção em ambiente externo.</li>
                    <li><strong>Da LamaTech:</strong> disponibilizar e manter a plataforma, atuando apenas como operadora da tecnologia.</li>
                  </ul>

                  <h4 className="font-bold text-main mb-2">8. Disponibilidade</h4>
                  <p className="mb-6">A plataforma poderá ficar temporariamente indisponível para manutenção, atualização ou por motivos alheios ao controle da LamaTech.</p>

                  <h4 className="font-bold text-main mb-2">9. Suspensão da Conta</h4>
                  <p className="mb-6">Contas poderão ser suspensas em caso de fraude, uso indevido, tentativa de invasão ou violação destes Termos.</p>

                  <h4 className="font-bold text-main mb-2">10. Alterações</h4>
                  <p className="mb-6">Os Termos poderão ser atualizados. Alterações relevantes poderão exigir novo aceite do usuário.</p>

                  <h4 className="font-bold text-main mb-2">11. Lei Aplicável</h4>
                  <p className="mb-6">Este documento é regido de acordo com a legislação brasileira.</p>
                </>
              ) : (
                <>
                  <div className="mb-6">
                    <p><strong>ArtReview</strong></p>
                    <p><strong>Versão:</strong> 1.0</p>
                    <p><strong>Data de Vigência:</strong> 11 de julho de 2026</p>
                  </div>

                  <h4 className="font-bold text-main mb-2">1. Introdução</h4>
                  <p className="mb-6">Esta Política de Privacidade explica como os dados pessoais são tratados na ArtReview em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</p>

                  <h4 className="font-bold text-main mb-2">2. Papéis no Tratamento</h4>
                  <ul className="mb-6 list-disc pl-5">
                    <li className="mb-2"><strong>Controlador:</strong> Professor responsável pelo curso, que define as finalidades e os meios do tratamento dos dados.</li>
                    <li><strong>Operadora:</strong> LamaTech, responsável por disponibilizar e manter a plataforma, tratando os dados conforme as instruções do controlador.</li>
                  </ul>

                  <h4 className="font-bold text-main mb-2">3. Dados Coletados</h4>
                  <p className="mb-6">São coletados dados cadastrais (nome, e-mail e telefone), dados de autenticação, registros técnicos necessários ao funcionamento da plataforma e os desenhos enviados para avaliação.</p>

                  <h4 className="font-bold text-main mb-2">4. Finalidades</h4>
                  <p className="mb-6">Os dados são utilizados para identificação do aluno, autenticação, prestação dos serviços, organização das avaliações, suporte técnico, segurança da plataforma e cumprimento de obrigações legais.</p>

                  <h4 className="font-bold text-main mb-2">5. Bases Legais</h4>
                  <p className="mb-6">O tratamento poderá ocorrer com fundamento na execução de contrato, legítimo interesse, cumprimento de obrigação legal, exercício regular de direitos e outras bases previstas na LGPD, conforme o caso.</p>

                  <h4 className="font-bold text-main mb-2">6. Compartilhamento</h4>
                  <p className="mb-4">Os dados não são vendidos.</p>
                  <p className="mb-4">O acesso é restrito ao professor (controlador) e à LamaTech (operadora), quando necessário para prestação do serviço.</p>
                  <p className="mb-6">A ArtReview não compartilha automaticamente dados com nenhuma outra plataforma.</p>

                  <h4 className="font-bold text-main mb-2">7. Armazenamento e Segurança</h4>
                  <p className="mb-6">Os dados são armazenados em infraestrutura do Google Firebase, com medidas técnicas e administrativas destinadas à proteção das informações contra acessos não autorizados.</p>

                  <h4 className="font-bold text-main mb-2">8. Retenção</h4>
                  <p className="mb-6">Os dados permanecerão armazenados pelo período necessário à prestação do serviço, cumprimento de obrigações legais ou exercício regular de direitos.</p>

                  <h4 className="font-bold text-main mb-2">9. Direitos do Titular</h4>
                  <p className="mb-6">O titular poderá solicitar acesso, correção, atualização, eliminação quando cabível, portabilidade, informações sobre o tratamento e demais direitos previstos na LGPD, entrando em contato com o controlador.</p>

                  <h4 className="font-bold text-main mb-2">10. Contato</h4>
                  <p className="mb-2"><strong>Controlador:</strong> [Nome do Professor]</p>
                  <p className="mb-4"><strong>E-mail:</strong> [E-mail]</p>
                  <p className="mb-2"><strong>Operadora:</strong> LamaTech</p>
                  <p className="mb-6"><strong>E-mail:</strong> lamatechdesenhos@gmail.com</p>

                  <h4 className="font-bold text-main mb-2">11. Atualizações</h4>
                  <p className="mb-6">Esta Política poderá ser alterada para refletir mudanças legais ou operacionais. A versão vigente permanecerá disponível na plataforma.</p>
                </>
              )}
            </div>

            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-dark)', display: 'flex', justifyContent: 'flex-end', borderBottomLeftRadius: 'var(--radius-lg)', borderBottomRightRadius: 'var(--radius-lg)' }}>
              <button className="btn btn-primary" onClick={() => {
                if (modalType === 'terms') {
                  setAcceptedTerms(true);
                } else {
                  setAcceptedPrivacy(true);
                }
                setShowTermsModal(false);
              }}>
                Li e Concordo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
