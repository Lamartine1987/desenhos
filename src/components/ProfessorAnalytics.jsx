import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { BarChart3, Users, CheckCircle, Image as ImageIcon, Trophy } from 'lucide-react';

export default function ProfessorAnalytics() {
  const { submissions, fetchUsers } = useAppContext();
  const [studentsCount, setStudentsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const users = await fetchUsers();
    const students = users.filter(u => u.role === 'student');
    setStudentsCount(students.length);
    setLoading(false);
  };

  const totalSubmissions = submissions.length;
  const evaluatedSubmissions = submissions.filter(s => s.status === 'evaluated').length;
  const pendingSubmissions = totalSubmissions - evaluatedSubmissions;
  const evaluationRate = totalSubmissions > 0 ? Math.round((evaluatedSubmissions / totalSubmissions) * 100) : 0;

  // Calculate top students ranking
  const studentStats = {};
  submissions.forEach(sub => {
    if (!studentStats[sub.studentId]) {
      studentStats[sub.studentId] = {
        name: sub.studentName || 'Aluno Desconhecido',
        count: 0
      };
    }
    studentStats[sub.studentId].count++;
  });

  const topStudents = Object.values(studentStats)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5

  if (loading) {
    return <div className="text-center py-12 text-muted">Carregando estatísticas...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 mb-2">
        <BarChart3 className="text-primary" size={28} />
        <h3 className="text-2xl font-bold">Estatísticas Gerais</h3>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-panel flex flex-col items-center justify-center text-center" style={{ padding: '1.5rem' }}>
          <div style={{ background: 'rgba(249, 115, 22, 0.1)', padding: '0.75rem', borderRadius: '50%', marginBottom: '0.75rem', color: 'var(--primary)' }}>
            <Users size={24} />
          </div>
          <span className="text-4xl font-bold mb-1">{studentsCount}</span>
          <span className="text-sm text-muted uppercase tracking-wider">Alunos Ativos</span>
        </div>
        
        <div className="glass-panel flex flex-col items-center justify-center text-center" style={{ padding: '1.5rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem', borderRadius: '50%', marginBottom: '0.75rem', color: 'var(--secondary)' }}>
            <ImageIcon size={24} />
          </div>
          <span className="text-4xl font-bold mb-1">{totalSubmissions}</span>
          <span className="text-sm text-muted uppercase tracking-wider">Desenhos Recebidos</span>
        </div>

        <div className="glass-panel flex flex-col items-center justify-center text-center" style={{ padding: '1.5rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '50%', marginBottom: '0.75rem', color: 'var(--success)' }}>
            <CheckCircle size={24} />
          </div>
          <span className="text-4xl font-bold mb-1">{evaluationRate}%</span>
          <span className="text-sm text-muted uppercase tracking-wider">Taxa de Correção</span>
          <span className="text-xs text-muted mt-2">{evaluatedSubmissions} corrigidos / {pendingSubmissions} pendentes</span>
        </div>
      </div>

      <div className="glass-panel mt-4" style={{ padding: '2rem' }}>
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="text-warning" size={24} />
          <h4 className="text-xl font-bold">Ranking de Engajamento (Top 5)</h4>
        </div>
        
        {topStudents.length > 0 ? (
          <div className="flex flex-col gap-3">
            {topStudents.map((student, index) => (
              <div key={index} className="flex items-center justify-between" style={{ padding: '1rem', borderRadius: '0.5rem', background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
                <div className="flex items-center gap-4">
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: index === 0 ? 'var(--warning)' : index === 1 ? '#9ca3af' : index === 2 ? '#d97706' : 'rgba(0,0,0,0.1)',
                    color: index < 3 ? 'white' : 'var(--text-muted)',
                    fontWeight: 'bold'
                  }}>
                    {index + 1}
                  </div>
                  <span className="font-medium text-lg">{student.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary text-xl">{student.count}</span>
                  <span className="text-sm text-muted">desenhos</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted text-center py-4">Nenhum desenho recebido ainda.</p>
        )}
      </div>
    </div>
  );
}
