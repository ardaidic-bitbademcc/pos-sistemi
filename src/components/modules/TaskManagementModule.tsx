import { useState, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Plus, 
  CheckCircle, 
  Clock, 
  Star,
  Trash,
  PencilSimple,
  ArrowClockwise,
  User,
  CalendarBlank,
  ListChecks,
  FlagBanner,
  Eye,
  Play,
  X,
  ChatCircle
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { Task, TaskPriority, TaskStatus, TaskRecurrence, Employee, UserRole, AuthSession, RolePermissions } from '@/lib/types';
import { generateId } from '@/lib/helpers';
import { useBranchFilter } from '@/hooks/use-branch-filter';

interface TaskManagementModuleProps {
  onBack: () => void;
  currentUserRole?: UserRole;
  currentUserId: string;
  currentUserName: string;
  authSession?: AuthSession | null;
}

const DEFAULT_ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: 'owner',
    permissions: ['pos', 'personnel', 'branch', 'menu', 'finance', 'settings', 'reports', 'tasks'],
    canViewFinancials: true,
    canEditPrices: true,
    canManageUsers: true,
    canApprovePayments: true,
    canViewCashRegister: true,
    canAddCash: true,
    canWithdrawCash: true,
    canCloseCashRegister: true,
    canCreateTask: true,
    canEditTask: true,
    canDeleteTask: true,
    canViewAllTasks: true,
    canViewTaskStatus: true,
    canRateTask: true,
  },
  {
    role: 'manager',
    permissions: ['pos', 'personnel', 'branch', 'menu', 'finance', 'reports', 'tasks'],
    canViewFinancials: true,
    canEditPrices: true,
    canManageUsers: false,
    canApprovePayments: true,
    canViewCashRegister: true,
    canAddCash: true,
    canWithdrawCash: true,
    canCloseCashRegister: true,
    canCreateTask: true,
    canEditTask: true,
    canDeleteTask: true,
    canViewAllTasks: true,
    canViewTaskStatus: true,
    canRateTask: true,
  },
  {
    role: 'waiter',
    permissions: ['pos', 'tasks'],
    canViewFinancials: false,
    canEditPrices: false,
    canManageUsers: false,
    canApprovePayments: false,
    canViewCashRegister: false,
    canAddCash: false,
    canWithdrawCash: false,
    canCloseCashRegister: false,
    canCreateTask: false,
    canEditTask: false,
    canDeleteTask: false,
    canViewAllTasks: false,
    canViewTaskStatus: false,
    canRateTask: false,
  },
  {
    role: 'cashier',
    permissions: ['pos', 'reports', 'tasks'],
    canViewFinancials: false,
    canEditPrices: false,
    canManageUsers: false,
    canApprovePayments: false,
    canViewCashRegister: true,
    canAddCash: true,
    canWithdrawCash: false,
    canCloseCashRegister: false,
    canCreateTask: false,
    canEditTask: false,
    canDeleteTask: false,
    canViewAllTasks: false,
    canViewTaskStatus: false,
    canRateTask: false,
  },
  {
    role: 'chef',
    permissions: ['menu', 'tasks'],
    canViewFinancials: false,
    canEditPrices: false,
    canManageUsers: false,
    canApprovePayments: false,
    canViewCashRegister: false,
    canAddCash: false,
    canWithdrawCash: false,
    canCloseCashRegister: false,
    canCreateTask: false,
    canEditTask: false,
    canDeleteTask: false,
    canViewAllTasks: false,
    canViewTaskStatus: true,
    canRateTask: false,
  },
  {
    role: 'staff',
    permissions: ['tasks'],
    canViewFinancials: false,
    canEditPrices: false,
    canManageUsers: false,
    canApprovePayments: false,
    canViewCashRegister: false,
    canAddCash: false,
    canWithdrawCash: false,
    canCloseCashRegister: false,
    canCreateTask: false,
    canEditTask: false,
    canDeleteTask: false,
    canViewAllTasks: false,
    canViewTaskStatus: false,
    canRateTask: false,
  },
];

export default function TaskManagementModule({ 
  onBack, 
  currentUserRole = 'staff',
  currentUserId = 'user-1',
  currentUserName = 'Kullanıcı',
  authSession
}: TaskManagementModuleProps) {
  const [tasks, setTasks] = useKV<Task[]>('tasks', []);
  const [employees] = useKV<Employee[]>('employees', []);
  const [rolePermissions] = useKV<RolePermissions[]>('rolePermissions', DEFAULT_ROLE_PERMISSIONS);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'my-tasks' | 'assigned-by-me'>('my-tasks');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium' as TaskPriority,
    dueDate: new Date().toISOString().split('T')[0],
    recurrence: 'none' as TaskRecurrence,
    category: '',
    estimatedDuration: '',
  });

  const [completionNotes, setCompletionNotes] = useState('');
  const [actualDuration, setActualDuration] = useState('');
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');

  const currentPermissions = rolePermissions?.find((rp) => rp.role === currentUserRole) || DEFAULT_ROLE_PERMISSIONS.find((rp) => rp.role === currentUserRole);
  
  const canCreateTask = currentPermissions?.canCreateTask || false;
  const canEditTask = currentPermissions?.canEditTask || false;
  const canDeleteTask = currentPermissions?.canDeleteTask || false;
  const canViewAllTasks = currentPermissions?.canViewAllTasks || false;
  const canViewTaskStatus = currentPermissions?.canViewTaskStatus || false;
  const canRateTask = currentPermissions?.canRateTask || false;

  useEffect(() => {
    checkRecurringTasks();
  }, []);

  const checkRecurringTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    
    setTasks((currentTasks) => {
      const updatedTasks = [...(currentTasks || [])];
      let hasChanges = false;

      currentTasks?.forEach((task) => {
        if (task.recurrence !== 'none' && task.status === 'completed') {
          const lastRecurrence = task.lastRecurrenceDate || task.createdAt.split('T')[0];
          const shouldRecur = shouldCreateRecurrence(lastRecurrence, task.recurrence, today);

          if (shouldRecur) {
            const newTask: Task = {
              ...task,
              id: generateId(),
              status: 'pending',
              createdAt: new Date().toISOString(),
              completedAt: undefined,
              completedBy: undefined,
              completedByName: undefined,
              rating: undefined,
              ratingComment: undefined,
              ratedBy: undefined,
              ratedByName: undefined,
              ratedAt: undefined,
              lastRecurrenceDate: today,
              actualDuration: undefined,
            };
            updatedTasks.push(newTask);
            hasChanges = true;
          }
        }
      });

      return hasChanges ? updatedTasks : currentTasks || [];
    });
  };

  const shouldCreateRecurrence = (lastDate: string, recurrence: TaskRecurrence, today: string): boolean => {
    const last = new Date(lastDate);
    const now = new Date(today);
    const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

    switch (recurrence) {
      case 'daily':
        return diffDays >= 1;
      case 'weekly':
        return diffDays >= 7;
      case 'monthly':
        return diffDays >= 30;
      default:
        return false;
    }
  };

  const filteredTasks = (tasks || []).filter((task) => {
    const statusMatch = filterStatus === 'all' || task.status === filterStatus;
    const priorityMatch = filterPriority === 'all' || task.priority === filterPriority;

    let tabMatch = true;
    if (activeTab === 'my-tasks') {
      tabMatch = task.assignedTo === currentUserId;
    } else if (activeTab === 'assigned-by-me') {
      tabMatch = task.createdBy === currentUserId;
    } else if (activeTab === 'all' && !canViewAllTasks) {
      tabMatch = task.assignedTo === currentUserId || task.createdBy === currentUserId;
    }

    return statusMatch && priorityMatch && tabMatch;
  });

  const myPendingTasks = (tasks || []).filter(
    (t) => t.assignedTo === currentUserId && t.status === 'pending'
  ).length;

  const myInProgressTasks = (tasks || []).filter(
    (t) => t.assignedTo === currentUserId && t.status === 'in_progress'
  ).length;

  const handleCreate = () => {
    if (!formData.title || !formData.assignedTo) {
      toast.error('Görev başlığı ve atanan kişi gerekli');
      return;
    }

    const assignedEmployee = employees?.find((e) => e.id === formData.assignedTo);
    if (!assignedEmployee) {
      toast.error('Atanan personel bulunamadı');
      return;
    }

    const newTask: Task = {
      id: generateId(),
      title: formData.title,
      description: formData.description,
      assignedTo: formData.assignedTo,
      assignedToName: assignedEmployee.fullName,
      createdBy: currentUserId,
      createdByName: currentUserName,
      priority: formData.priority,
      status: 'pending',
      dueDate: formData.dueDate,
      createdAt: new Date().toISOString(),
      recurrence: formData.recurrence,
      branchId: 'branch-1',
      category: formData.category,
      estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : undefined,
    };

    setTasks((current) => [...(current || []), newTask]);
    toast.success('Görev oluşturuldu');
    setShowCreateDialog(false);
    resetForm();
  };

  const handleEdit = () => {
    if (!selectedTask || !formData.title || !formData.assignedTo) {
      toast.error('Geçersiz görev bilgisi');
      return;
    }

    const assignedEmployee = employees?.find((e) => e.id === formData.assignedTo);
    if (!assignedEmployee) {
      toast.error('Atanan personel bulunamadı');
      return;
    }

    setTasks((current) =>
      (current || []).map((task) =>
        task.id === selectedTask.id
          ? {
              ...task,
              title: formData.title,
              description: formData.description,
              assignedTo: formData.assignedTo,
              assignedToName: assignedEmployee.fullName,
              priority: formData.priority,
              dueDate: formData.dueDate,
              recurrence: formData.recurrence,
              category: formData.category,
              estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : undefined,
            }
          : task
      )
    );

    toast.success('Görev güncellendi');
    setShowEditDialog(false);
    setSelectedTask(null);
    resetForm();
  };

  const handleDelete = (taskId: string) => {
    setTasks((current) => (current || []).filter((task) => task.id !== taskId));
    toast.success('Görev silindi');
  };

  const handleStartTask = (task: Task) => {
    setTasks((current) =>
      (current || []).map((t) =>
        t.id === task.id
          ? { ...t, status: 'in_progress' as TaskStatus }
          : t
      )
    );
    toast.success('Görev başlatıldı');
  };

  const handleCompleteTask = () => {
    if (!selectedTask) return;

    setTasks((current) =>
      (current || []).map((task) =>
        task.id === selectedTask.id
          ? {
              ...task,
              status: 'completed' as TaskStatus,
              completedAt: new Date().toISOString(),
              completedBy: currentUserId,
              completedByName: currentUserName,
              notes: completionNotes,
              actualDuration: actualDuration ? parseInt(actualDuration) : undefined,
            }
          : task
      )
    );

    toast.success('Görev tamamlandı');
    setShowCompleteDialog(false);
    setSelectedTask(null);
    setCompletionNotes('');
    setActualDuration('');
  };

  const handleRateTask = () => {
    if (!selectedTask || rating === 0) {
      toast.error('Lütfen bir puan seçin');
      return;
    }

    setTasks((current) =>
      (current || []).map((task) =>
        task.id === selectedTask.id
          ? {
              ...task,
              rating,
              ratingComment,
              ratedBy: currentUserId,
              ratedByName: currentUserName,
              ratedAt: new Date().toISOString(),
            }
          : task
      )
    );

    toast.success('Görev puanlandı');
    setShowRatingDialog(false);
    setSelectedTask(null);
    setRating(0);
    setRatingComment('');
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      assignedTo: '',
      priority: 'medium',
      dueDate: new Date().toISOString().split('T')[0],
      recurrence: 'none',
      category: '',
      estimatedDuration: '',
    });
  };

  const openEditDialog = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      assignedTo: task.assignedTo,
      priority: task.priority,
      dueDate: task.dueDate,
      recurrence: task.recurrence,
      category: task.category || '',
      estimatedDuration: task.estimatedDuration?.toString() || '',
    });
    setShowEditDialog(true);
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getPriorityLabel = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return 'Acil';
      case 'high':
        return 'Yüksek';
      case 'medium':
        return 'Orta';
      case 'low':
        return 'Düşük';
      default:
        return priority;
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return 'Bekliyor';
      case 'in_progress':
        return 'Devam Ediyor';
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal';
      default:
        return status;
    }
  };

  const getRecurrenceLabel = (recurrence: TaskRecurrence) => {
    switch (recurrence) {
      case 'daily':
        return 'Günlük';
      case 'weekly':
        return 'Haftalık';
      case 'monthly':
        return 'Aylık';
      case 'none':
        return 'Tek Seferlik';
      default:
        return recurrence;
    }
  };

  return (
    <div className="min-h-screen p-3 sm:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-background via-background to-primary/5">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-3xl font-semibold tracking-tight flex items-center gap-2 sm:gap-3 truncate">
              <ListChecks className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" weight="bold" />
              <span className="truncate">Görev Yönetimi</span>
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm truncate">
              Personel görev atama ve takip sistemi
            </p>
          </div>
        </div>
        {canCreateTask && (
          <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto text-xs sm:text-sm h-9">
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
            <span className="hidden sm:inline">Yeni Görev</span>
            <span className="sm:hidden">Yeni</span>
          </Button>
        )}
      </header>

      {canViewTaskStatus && (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bekleyen</p>
                  <p className="text-3xl font-bold">{myPendingTasks}</p>
                </div>
                <Clock className="h-10 w-10 text-amber-500" weight="bold" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Devam Eden</p>
                  <p className="text-3xl font-bold">{myInProgressTasks}</p>
                </div>
                <Play className="h-10 w-10 text-blue-500" weight="bold" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bugün Tamamlanan</p>
                  <p className="text-3xl font-bold">
                    {
                      (tasks || []).filter(
                        (t) =>
                          t.status === 'completed' &&
                          t.completedAt &&
                          new Date(t.completedAt).toDateString() === new Date().toDateString()
                      ).length
                    }
                  </p>
                </div>
                <CheckCircle className="h-10 w-10 text-emerald-500" weight="bold" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tekrarlayan</p>
                  <p className="text-3xl font-bold">
                    {(tasks || []).filter((t) => t.recurrence !== 'none').length}
                  </p>
                </div>
                <ArrowClockwise className="h-10 w-10 text-purple-500" weight="bold" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Görevler</CardTitle>
              <CardDescription>Tüm görevleri listele ve yönet</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as TaskStatus | 'all')}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="pending">Bekleyen</SelectItem>
                  <SelectItem value="in_progress">Devam Eden</SelectItem>
                  <SelectItem value="completed">Tamamlanan</SelectItem>
                  <SelectItem value="cancelled">İptal</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPriority} onValueChange={(value) => setFilterPriority(value as TaskPriority | 'all')}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Öncelikler</SelectItem>
                  <SelectItem value="urgent">Acil</SelectItem>
                  <SelectItem value="high">Yüksek</SelectItem>
                  <SelectItem value="medium">Orta</SelectItem>
                  <SelectItem value="low">Düşük</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList>
              <TabsTrigger value="my-tasks">
                Benim Görevlerim ({(tasks || []).filter((t) => t.assignedTo === currentUserId).length})
              </TabsTrigger>
              {canCreateTask && (
                <TabsTrigger value="assigned-by-me">
                  Verdiğim Görevler ({(tasks || []).filter((t) => t.createdBy === currentUserId).length})
                </TabsTrigger>
              )}
              {canViewAllTasks && (
                <TabsTrigger value="all">
                  Tüm Görevler ({(tasks || []).length})
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4 mt-4">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <ListChecks className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Görev bulunamadı</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTasks.map((task) => {
                    const isOverdue =
                      task.status !== 'completed' &&
                      task.status !== 'cancelled' &&
                      new Date(task.dueDate) < new Date();
                    const canEditThisTask = (canEditTask && task.createdBy === currentUserId) || (currentUserRole === 'owner' || currentUserRole === 'manager');
                    const canDeleteThisTask = (canDeleteTask && task.createdBy === currentUserId) || (currentUserRole === 'owner' || currentUserRole === 'manager');
                    const canStart = task.assignedTo === currentUserId && task.status === 'pending';
                    const canComplete =
                      task.assignedTo === currentUserId &&
                      (task.status === 'in_progress' || task.status === 'pending');
                    const canRateThisTask =
                      canRateTask &&
                      task.status === 'completed' &&
                      !task.rating &&
                      task.completedBy !== currentUserId;

                    return (
                      <Card
                        key={task.id}
                        className={`relative ${
                          isOverdue ? 'border-destructive bg-destructive/5' : ''
                        } ${task.status === 'completed' ? 'opacity-75' : ''}`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant={getPriorityColor(task.priority)}>
                                  <FlagBanner className="h-3 w-3 mr-1" weight="fill" />
                                  {getPriorityLabel(task.priority)}
                                </Badge>
                                {task.recurrence !== 'none' && (
                                  <Badge variant="outline">
                                    <ArrowClockwise className="h-3 w-3 mr-1" />
                                    {getRecurrenceLabel(task.recurrence)}
                                  </Badge>
                                )}
                              </div>
                              <CardTitle className="text-base leading-tight">{task.title}</CardTitle>
                              {task.description && (
                                <CardDescription className="text-xs line-clamp-2 mt-1">
                                  {task.description}
                                </CardDescription>
                              )}
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-3">
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Atanan:</span>
                              <span className="font-medium">{task.assignedToName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CalendarBlank className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Tarih:</span>
                              <span className={`font-medium ${isOverdue ? 'text-destructive' : ''}`}>
                                {new Date(task.dueDate).toLocaleDateString('tr-TR')}
                              </span>
                              {isOverdue && (
                                <Badge variant="destructive" className="text-xs">
                                  Gecikmiş
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Durum:</span>
                              <Badge
                                variant={
                                  task.status === 'completed'
                                    ? 'default'
                                    : task.status === 'in_progress'
                                    ? 'secondary'
                                    : 'outline'
                                }
                              >
                                {getStatusLabel(task.status)}
                              </Badge>
                            </div>
                            {task.rating && (
                              <div className="flex items-center gap-2">
                                <Star className="h-4 w-4 text-amber-500" weight="fill" />
                                <span className="text-muted-foreground">Puan:</span>
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className="h-3 w-3"
                                      weight={star <= task.rating! ? 'fill' : 'regular'}
                                      color={star <= task.rating! ? '#f59e0b' : '#d1d5db'}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <Separator />

                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedTask(task);
                                setShowDetailsDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Detay
                            </Button>

                            {canStart && (
                              <Button variant="secondary" size="sm" onClick={() => handleStartTask(task)}>
                                <Play className="h-4 w-4 mr-1" />
                                Başlat
                              </Button>
                            )}

                            {canComplete && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  setSelectedTask(task);
                                  setShowCompleteDialog(true);
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Tamamla
                              </Button>
                            )}

                            {canRateThisTask && (
                            {canRateThisTask && (
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedTask(task);
                                  setShowRatingDialog(true);
                                }}
                              >
                                <Star className="h-4 w-4 mr-1" />
                                Puanla
                              </Button>
                            )}

                            {canEditThisTask && task.status !== 'completed' && (
                            {canEditThisTask && task.status !== 'completed' && (
                                <Button variant="ghost" size="sm" onClick={() => openEditDialog(task)}>
                                  <PencilSimple className="h-4 w-4" />
                                </Button>
                                {canDeleteThisTask && (
                                {canDeleteThisTask && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(task.id)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                )}
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yeni Görev Oluştur</DialogTitle>
            <DialogDescription>Personele atanacak yeni bir görev oluşturun</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Görev Başlığı *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Görev başlığı girin"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Görev detaylarını girin"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Atanan Personel *</Label>
                <Select value={formData.assignedTo} onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Personel seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {(employees || []).filter((e) => e.isActive).map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.fullName} - {employee.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Öncelik</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Düşük</SelectItem>
                    <SelectItem value="medium">Orta</SelectItem>
                    <SelectItem value="high">Yüksek</SelectItem>
                    <SelectItem value="urgent">Acil</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Bitiş Tarihi</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Tekrarlama</Label>
                <Select value={formData.recurrence} onValueChange={(value) => setFormData({ ...formData, recurrence: value as TaskRecurrence })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tek Seferlik</SelectItem>
                    <SelectItem value="daily">Günlük</SelectItem>
                    <SelectItem value="weekly">Haftalık</SelectItem>
                    <SelectItem value="monthly">Aylık</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="temizlik">Temizlik</SelectItem>
                    <SelectItem value="bakim">Bakım-Onarım</SelectItem>
                    <SelectItem value="mutfak">Mutfak</SelectItem>
                    <SelectItem value="servis">Servis</SelectItem>
                    <SelectItem value="stok">Stok Yönetimi</SelectItem>
                    <SelectItem value="finans">Finans</SelectItem>
                    <SelectItem value="diger">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tahmini Süre (dakika)</Label>
                <Input
                  type="number"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                  placeholder="Tahmini süre"
                  min="0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              resetForm();
            }}>
              İptal
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Görev Düzenle</DialogTitle>
            <DialogDescription>Görev bilgilerini güncelleyin</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Görev Başlığı *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Görev başlığı girin"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Görev detaylarını girin"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Atanan Personel *</Label>
                <Select value={formData.assignedTo} onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Personel seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {(employees || []).filter((e) => e.isActive).map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.fullName} - {employee.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Öncelik</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Düşük</SelectItem>
                    <SelectItem value="medium">Orta</SelectItem>
                    <SelectItem value="high">Yüksek</SelectItem>
                    <SelectItem value="urgent">Acil</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Bitiş Tarihi</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Tekrarlama</Label>
                <Select value={formData.recurrence} onValueChange={(value) => setFormData({ ...formData, recurrence: value as TaskRecurrence })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tek Seferlik</SelectItem>
                    <SelectItem value="daily">Günlük</SelectItem>
                    <SelectItem value="weekly">Haftalık</SelectItem>
                    <SelectItem value="monthly">Aylık</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="temizlik">Temizlik</SelectItem>
                    <SelectItem value="bakim">Bakım-Onarım</SelectItem>
                    <SelectItem value="mutfak">Mutfak</SelectItem>
                    <SelectItem value="servis">Servis</SelectItem>
                    <SelectItem value="stok">Stok Yönetimi</SelectItem>
                    <SelectItem value="finans">Finans</SelectItem>
                    <SelectItem value="diger">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tahmini Süre (dakika)</Label>
                <Input
                  type="number"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                  placeholder="Tahmini süre"
                  min="0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditDialog(false);
              setSelectedTask(null);
              resetForm();
            }}>
              İptal
            </Button>
            <Button onClick={handleEdit}>
              <PencilSimple className="h-4 w-4 mr-2" />
              Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Görev Detayları</DialogTitle>
            <DialogDescription>Görevin tüm bilgilerini görüntüleyin</DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Başlık</Label>
                  <p className="font-semibold text-lg">{selectedTask.title}</p>
                </div>

                {selectedTask.description && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Açıklama</Label>
                    <p className="text-sm">{selectedTask.description}</p>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Atanan</Label>
                    <p className="font-medium">{selectedTask.assignedToName}</p>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Oluşturan</Label>
                    <p className="font-medium">{selectedTask.createdByName}</p>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Öncelik</Label>
                    <Badge variant={getPriorityColor(selectedTask.priority)}>
                      {getPriorityLabel(selectedTask.priority)}
                    </Badge>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Durum</Label>
                    <Badge>{getStatusLabel(selectedTask.status)}</Badge>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Bitiş Tarihi</Label>
                    <p className="font-medium">
                      {new Date(selectedTask.dueDate).toLocaleDateString('tr-TR')}
                    </p>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Tekrarlama</Label>
                    <Badge variant="outline">{getRecurrenceLabel(selectedTask.recurrence)}</Badge>
                  </div>

                  {selectedTask.category && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Kategori</Label>
                      <p className="font-medium">{selectedTask.category}</p>
                    </div>
                  )}

                  {selectedTask.estimatedDuration && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Tahmini Süre</Label>
                      <p className="font-medium">{selectedTask.estimatedDuration} dakika</p>
                    </div>
                  )}
                </div>

                {selectedTask.status === 'completed' && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Tamamlayan</Label>
                        <p className="font-medium">{selectedTask.completedByName}</p>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">Tamamlanma Tarihi</Label>
                        <p className="font-medium">
                          {selectedTask.completedAt
                            ? new Date(selectedTask.completedAt).toLocaleString('tr-TR')
                            : '-'}
                        </p>
                      </div>

                      {selectedTask.actualDuration && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Gerçekleşen Süre</Label>
                          <p className="font-medium">{selectedTask.actualDuration} dakika</p>
                        </div>
                      )}

                      {selectedTask.notes && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Notlar</Label>
                          <p className="text-sm">{selectedTask.notes}</p>
                        </div>
                      )}

                      {selectedTask.rating && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Puan</Label>
                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className="h-5 w-5"
                                weight={star <= selectedTask.rating! ? 'fill' : 'regular'}
                                color={star <= selectedTask.rating! ? '#f59e0b' : '#d1d5db'}
                              />
                            ))}
                          </div>
                          {selectedTask.ratingComment && (
                            <p className="text-sm mt-2">{selectedTask.ratingComment}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDetailsDialog(false);
              setSelectedTask(null);
            }}>
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Görevi Tamamla</DialogTitle>
            <DialogDescription>Görev tamamlandı olarak işaretlenecek</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Gerçekleşen Süre (dakika)</Label>
              <Input
                type="number"
                value={actualDuration}
                onChange={(e) => setActualDuration(e.target.value)}
                placeholder="Dakika cinsinden"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Notlar</Label>
              <Textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Tamamlama notları (opsiyonel)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCompleteDialog(false);
              setSelectedTask(null);
              setCompletionNotes('');
              setActualDuration('');
            }}>
              İptal
            </Button>
            <Button onClick={handleCompleteTask}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Tamamla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Görevi Puanla</DialogTitle>
            <DialogDescription>Tamamlanan görev için puan verin</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Puan *</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className="h-10 w-10 cursor-pointer hover:scale-110 transition-transform"
                      weight={star <= rating ? 'fill' : 'regular'}
                      color={star <= rating ? '#f59e0b' : '#d1d5db'}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Yorum</Label>
              <Textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Puanlama yorumu (opsiyonel)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRatingDialog(false);
              setSelectedTask(null);
              setRating(0);
              setRatingComment('');
            }}>
              İptal
            </Button>
            <Button onClick={handleRateTask}>
              <Star className="h-4 w-4 mr-2" weight="fill" />
              Puanla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
