import { useAuth } from '../hooks/useAuth';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { logout } from '../services/auth.service';
import { useNavigate } from 'react-router-dom';

export function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <div className="text-2xl font-black text-white">Configurações</div>
        <div className="text-sm text-slate-300 font-medium">Perfil, preferências e plano.</div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-2 text-sm font-semibold text-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Nome</span>
                <span className="text-slate-900 font-black">{user?.name || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">E-mail</span>
                <span className="text-slate-900 font-black">{user?.email || '—'}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plano</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-900 font-black text-lg capitalize">{user?.plan || 'free'}</div>
                <div className="text-slate-500 text-sm font-medium mt-1">Pronto para upgrade quando quiser.</div>
              </div>
              <Button variant="secondary">Gerenciar</Button>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sessão</CardTitle>
        </CardHeader>
        <CardBody>
          <Button
            variant="danger"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Sair
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}

