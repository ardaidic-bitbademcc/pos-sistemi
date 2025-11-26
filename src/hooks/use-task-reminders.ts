import { useEffect } from 'react';
import { useKV } from './use-kv-store';
import { toast } from 'sonner';
import type { Task, AuthSession } from '@/lib/types';

interface TaskReminderSettings {
  enabled: boolean;
  urgentTaskReminder: boolean;
  dueTodayReminder: boolean;
  dueTomorrowReminder: boolean;
  overdueReminder: boolean;
  reminderInterval: number;
}

const DEFAULT_SETTINGS: TaskReminderSettings = {
  enabled: true,
  urgentTaskReminder: true,
  dueTodayReminder: true,
  dueTomorrowReminder: true,
  overdueReminder: true,
  reminderInterval: 15,
};

export function useTaskReminders(authSession?: AuthSession | null) {
  const [tasks] = useKV<Task[]>('tasks', []);
  const [reminderSettings] = useKV<TaskReminderSettings>('taskReminderSettings', DEFAULT_SETTINGS);
  const [lastReminderTime, setLastReminderTime] = useKV<string>(
    `lastTaskReminderTime_${authSession?.userId || 'guest'}`, 
    ''
  );

  useEffect(() => {
    if (!reminderSettings?.enabled || !authSession?.userId) {
      return;
    }

    const checkReminders = () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const lastReminder = lastReminderTime ? new Date(lastReminderTime) : null;
      const minutesSinceLastReminder = lastReminder 
        ? (now.getTime() - lastReminder.getTime()) / (1000 * 60) 
        : Infinity;

      if (minutesSinceLastReminder < reminderSettings.reminderInterval) {
        return;
      }

      const myPendingTasks = (tasks || []).filter(
        (task) => 
          task.assignedTo === authSession.userId &&
          (task.status === 'pending' || task.status === 'in_progress') &&
          (!authSession.branchId || task.branchId === authSession.branchId)
      );

      let notificationCount = 0;
      const maxNotifications = 3;

      if (reminderSettings.overdueReminder) {
        const overdueTasks = myPendingTasks.filter((task) => {
          const dueDate = new Date(task.dueDate);
          return dueDate < now && task.dueDate < today;
        });

        if (overdueTasks.length > 0) {
          const urgentOverdue = overdueTasks.filter(t => t.priority === 'urgent');
          const highOverdue = overdueTasks.filter(t => t.priority === 'high');
          
          if (urgentOverdue.length > 0 && notificationCount < maxNotifications) {
            toast.error(`🚨 ${urgentOverdue.length} acil göreviniz gecikmede!`, {
              description: urgentOverdue.slice(0, 2).map(t => `• ${t.title}`).join('\n'),
              duration: 8000,
            });
            notificationCount++;
          } else if (highOverdue.length > 0 && notificationCount < maxNotifications) {
            toast.warning(`⚠️ ${highOverdue.length} yüksek öncelikli göreviniz gecikmede`, {
              description: highOverdue.slice(0, 2).map(t => `• ${t.title}`).join('\n'),
              duration: 6000,
            });
            notificationCount++;
          } else if (overdueTasks.length > 0 && notificationCount < maxNotifications) {
            toast.warning(`📅 ${overdueTasks.length} göreviniz gecikmede`, {
              description: overdueTasks.slice(0, 2).map(t => `• ${t.title}`).join('\n'),
              duration: 5000,
            });
            notificationCount++;
          }
        }
      }

      if (reminderSettings.urgentTaskReminder && notificationCount < maxNotifications) {
        const urgentTasks = myPendingTasks.filter(
          (task) => task.priority === 'urgent' && task.dueDate >= today
        );

        if (urgentTasks.length > 0) {
          toast.error(`🔥 ${urgentTasks.length} acil göreviniz var`, {
            description: urgentTasks.slice(0, 2).map(t => {
              const dueDate = new Date(t.dueDate);
              const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const timeInfo = diffDays === 0 ? 'Bugün' : diffDays === 1 ? 'Yarın' : `${diffDays} gün içinde`;
              return `• ${t.title} (${timeInfo})`;
            }).join('\n'),
            duration: 7000,
          });
          notificationCount++;
        }
      }

      if (reminderSettings.dueTodayReminder && notificationCount < maxNotifications) {
        const dueTodayTasks = myPendingTasks.filter(
          (task) => task.dueDate === today && task.priority !== 'urgent'
        );

        if (dueTodayTasks.length > 0) {
          const highPriority = dueTodayTasks.filter(t => t.priority === 'high');
          
          if (highPriority.length > 0) {
            toast.warning(`⏰ ${highPriority.length} yüksek öncelikli göreviniz bugün bitiyor`, {
              description: highPriority.slice(0, 2).map(t => `• ${t.title}`).join('\n'),
              duration: 6000,
            });
            notificationCount++;
          } else if (dueTodayTasks.length > 0) {
            toast.info(`📋 ${dueTodayTasks.length} göreviniz bugün bitiyor`, {
              description: dueTodayTasks.slice(0, 2).map(t => `• ${t.title}`).join('\n'),
              duration: 5000,
            });
            notificationCount++;
          }
        }
      }

      if (reminderSettings.dueTomorrowReminder && notificationCount < maxNotifications) {
        const dueTomorrowTasks = myPendingTasks.filter(
          (task) => task.dueDate === tomorrow && (task.priority === 'high' || task.priority === 'urgent')
        );

        if (dueTomorrowTasks.length > 0) {
          toast.info(`📅 ${dueTomorrowTasks.length} önemli göreviniz yarın bitiyor`, {
            description: dueTomorrowTasks.slice(0, 2).map(t => `• ${t.title}`).join('\n'),
            duration: 5000,
          });
          notificationCount++;
        }
      }

      if (notificationCount > 0) {
        setLastReminderTime(now.toISOString());
      }
    };

    checkReminders();

    const intervalId = setInterval(checkReminders, reminderSettings.reminderInterval * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [tasks, reminderSettings, authSession, lastReminderTime, setLastReminderTime]);
}
