import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Sidebar } from '@/components/layout/Sidebar';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { ProjectBoard } from '@/components/projects/ProjectBoard';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  name: string;
  color: string;
  description?: string | null;
}

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error loading projects', variant: 'destructive' });
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  const handleCreateProject = async (data: { name: string; description: string; color: string }) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    // Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: data.name,
        description: data.description || null,
        color: data.color,
        owner_id: user.id,
      })
      .select()
      .single();

    if (projectError) {
      toast({ title: 'Error creating project', description: projectError.message, variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }

    // Add owner as project member
    await supabase.from('project_members').insert({
      project_id: project.id,
      user_id: user.id,
      role: 'owner',
    });

    setProjects((prev) => [project, ...prev]);
    setCreateProjectOpen(false);
    setIsSubmitting(false);
    toast({ title: 'Project created!' });
    setCurrentProject(project);
  };

  const handleSelectProject = (project: Project) => {
    setCurrentProject(project);
  };

  const handleBackToDashboard = () => {
    setCurrentProject(null);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        projects={projects}
        currentProject={currentProject}
        onSelectProject={handleSelectProject}
        onNewProject={() => setCreateProjectOpen(true)}
      />

      <main className="flex-1 overflow-hidden">
        {currentProject ? (
          <ProjectBoard project={currentProject} onBack={handleBackToDashboard} />
        ) : (
          <Dashboard
            projects={projects}
            onSelectProject={handleSelectProject}
            onNewProject={() => setCreateProjectOpen(true)}
          />
        )}
      </main>

      <CreateProjectDialog
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
        onSubmit={handleCreateProject}
        isLoading={isSubmitting}
      />
    </div>
  );
}
