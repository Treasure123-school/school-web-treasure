import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase, isRealtimeEnabled, realtimeHealthMonitor } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeTableConfig {
  table: string;
  queryKeys: string[][];
  throttleMs?: number;
} // fixed
const HIGH_VOLUME_TABLES = new Set(['student_answers', 'attendance', 'messages', 'notifications']);

const GLOBAL_REALTIME_TABLES: RealtimeTableConfig[] = [
  { table: 'users', queryKeys: [['/api/users'], ['/api/admin/users'], ['/api/super-admin/users'], ['/api/auth/me']] },
  { table: 'students', queryKeys: [['/api/students'], ['/api/admin/students'], ['/api/student/profile']] },
  { table: 'teacher_profiles', queryKeys: [['/api/teachers'], ['/api/admin/teachers'], ['/api/teacher/profile']] },
  { table: 'admin_profiles', queryKeys: [['/api/admins'], ['/api/admin/profile']] },
  { table: 'parent_profiles', queryKeys: [['/api/parents'], ['/api/parent/profile']] },
  { table: 'classes', queryKeys: [['/api/classes'], ['/api/admin/classes'], ['/api/teacher/classes']] },
  { table: 'subjects', queryKeys: [['/api/subjects'], ['/api/admin/subjects']] },
  { table: 'exams', queryKeys: [['/api/exams'], ['/api/admin/exams'], ['/api/teacher/exams'], ['/api/student/exams']] },
  { table: 'exam_questions', queryKeys: [['/api/exam-questions'], ['/api/exams/question-counts']] },
  { table: 'exam_results', queryKeys: [['/api/exam-results'], ['/api/results'], ['/api/admin/results'], ['/api/teacher/results'], ['/api/student/results']] },
  { table: 'exam_sessions', queryKeys: [['/api/exam-sessions'], ['/api/student/exam-sessions']] },
  { table: 'student_answers', queryKeys: [['/api/student-answers'], ['/api/teacher/grading']], throttleMs: 2000 },
  { table: 'attendance', queryKeys: [['/api/attendance'], ['/api/admin/attendance'], ['/api/teacher/attendance'], ['/api/student/attendance']], throttleMs: 1500 },
  { table: 'announcements', queryKeys: [['/api/announcements'], ['/api/admin/announcements'], ['/api/public/announcements']] },
  { table: 'messages', queryKeys: [['/api/messages'], ['/api/student/messages'], ['/api/teacher/messages']], throttleMs: 1000 },
  { table: 'gallery', queryKeys: [['/api/gallery'], ['/api/admin/gallery'], ['/api/public/gallery']] },
  { table: 'gallery_categories', queryKeys: [['/api/gallery-categories'], ['/api/admin/gallery-categories']] },
  { table: 'notifications', queryKeys: [['/api/notifications'], ['/api/admin/notifications']], throttleMs: 1000 },
  { table: 'study_resources', queryKeys: [['/api/study-resources'], ['/api/admin/study-resources'], ['/api/teacher/study-resources'], ['/api/student/study-resources']] },
  { table: 'report_cards', queryKeys: [['/api/report-cards'], ['/api/admin/report-cards'], ['/api/student/report-cards']] },
  { table: 'report_card_items', queryKeys: [['/api/report-card-items']] },
  { table: 'teacher_applications', queryKeys: [['/api/teacher-applications'], ['/api/admin/teacher-applications']] },
  { table: 'vacancies', queryKeys: [['/api/vacancies'], ['/api/admin/vacancies']] },
  { table: 'approved_teachers', queryKeys: [['/api/approved-teachers'], ['/api/admin/approved-teachers']] },
  { table: 'grading_tasks', queryKeys: [['/api/grading-tasks'], ['/api/teacher/grading-tasks']] },
  { table: 'timetable', queryKeys: [['/api/timetable'], ['/api/admin/timetable'], ['/api/teacher/timetable'], ['/api/student/timetable']] },
  { table: 'home_page_content', queryKeys: [['/api/homepage-content'], ['/api/public/homepage-content'], ['/api/admin/homepage-content']] },
  { table: 'contact_messages', queryKeys: [['/api/contact-messages'], ['/api/admin/contact-messages']] },
  { table: 'academic_terms', queryKeys: [['/api/academic-terms'], ['/api/admin/academic-terms']] },
  { table: 'system_settings', queryKeys: [['/api/settings'], ['/api/admin/settings'], ['/api/super-admin/settings']] }
];

function createThrottledInvalidator(throttleMs: number) {
  let timeoutId: NodeJS.Timeout | null = null;
  let pendingKeys: Set<string> = new Set();

  return (queryKeys: string[][]) => {
    queryKeys.forEach(key => pendingKeys.add(JSON.stringify(key)));

    if (timeoutId) return;

    timeoutId = setTimeout(() => {
      const keys = Array.from(pendingKeys).map(k => JSON.parse(k));
      keys.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey, exact: false });
      });
      
      pendingKeys.clear();
      timeoutId = null;
    }, throttleMs);
  };
} // fixed
export function useGlobalRealtime() {
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const throttlersRef = useRef<Map<string, (keys: string[][]) => void>>(new Map());
  const pollingIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  const startPollingForTable = useCallback((table: string, queryKeys: string[][]) => {
    if (pollingIntervalsRef.current.has(table)) return;

    const interval = setInterval(() => {
      queryKeys.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey, exact: false });
      });
    }, HIGH_VOLUME_TABLES.has(table) ? 60000 : 30000);

    pollingIntervalsRef.current.set(table, interval);
  }, []);

  const stopPollingForTable = useCallback((table: string) => {
    const interval = pollingIntervalsRef.current.get(table);
    if (interval) {
      clearInterval(interval);
      pollingIntervalsRef.current.delete(table);
    }
  }, []);

  const startPollingForAllTables = useCallback(() => {
    GLOBAL_REALTIME_TABLES.forEach(({ table, queryKeys }) => {
      startPollingForTable(table, queryKeys);
    });
    setIsFallbackMode(true);
  }, [startPollingForTable]);

  const stopAllPolling = useCallback(() => {
    pollingIntervalsRef.current.forEach(interval => clearInterval(interval));
    pollingIntervalsRef.current.clear();
  }, []);

  useEffect(() => {
    if (!isRealtimeEnabled() || !supabase) {
      startPollingForAllTables();
      return () => stopAllPolling();
    } // fixed

    GLOBAL_REALTIME_TABLES.forEach(({ table, queryKeys, throttleMs }) => {
      if (!supabase) return;

      if (throttleMs) {
        throttlersRef.current.set(table, createThrottledInvalidator(throttleMs));
      } // fixed
      realtimeHealthMonitor.recordConnection();

      const channel = supabase
        .channel(`global:${table}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          (payload) => {
            realtimeHealthMonitor.recordSuccess();
            
            const throttler = throttlersRef.current.get(table);
            if (throttler) {
              throttler(queryKeys);
            } else {
              queryKeys.forEach(queryKey => {
                queryClient.invalidateQueries({ queryKey, exact: false });
              });
            }
          }
        )
        .subscribe((status, error) => {
          if (status === 'SUBSCRIBED') {
            realtimeHealthMonitor.recordSuccess();
            stopPollingForTable(table);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            realtimeHealthMonitor.recordError(error || new Error(status));
            
            if (realtimeHealthMonitor.shouldUseFallback()) {
              setIsFallbackMode(true);
              startPollingForTable(table, queryKeys);
              
              if (channelsRef.current && supabase) {
                const channelToRemove = channelsRef.current.find(ch => ch.topic.includes(table));
                if (channelToRemove) {
                  supabase.removeChannel(channelToRemove);
                }
              }
            }
          } else if (status === 'CLOSED') {
            if (realtimeHealthMonitor.shouldUseFallback()) {
              startPollingForTable(table, queryKeys);
            }
          }
        });

      channelsRef.current.push(channel);
    });

    const unregisterRecovery = realtimeHealthMonitor.registerRecoveryCallback(() => {
      setIsFallbackMode(false);
      stopAllPolling();
    });

    return () => {
      channelsRef.current.forEach(channel => supabase?.removeChannel(channel));
      channelsRef.current = [];
      stopAllPolling();
      throttlersRef.current.clear();
      unregisterRecovery();
    };
  }, [startPollingForAllTables, stopAllPolling, startPollingForTable, stopPollingForTable]);

  return {
    isEnabled: isRealtimeEnabled(),
    tableCount: GLOBAL_REALTIME_TABLES.length,
    isFallbackMode
  };
}
