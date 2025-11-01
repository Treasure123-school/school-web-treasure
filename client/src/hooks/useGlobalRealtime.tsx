import { useEffect } from 'react';
import { supabase, isRealtimeEnabled } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeTableConfig {
  table: string;
  queryKeys: string[][];
}

const GLOBAL_REALTIME_TABLES: RealtimeTableConfig[] = [
  { table: 'users', queryKeys: [['/api/users'], ['/api/admin/users'], ['/api/super-admin/users'], ['/api/auth/me']] },
  { table: 'students', queryKeys: [['/api/students'], ['/api/admin/students'], ['/api/student/profile']] },
  { table: 'teacher_profiles', queryKeys: [['/api/teachers'], ['/api/admin/teachers'], ['/api/teacher/profile']] },
  { table: 'admin_profiles', queryKeys: [['/api/admins'], ['/api/admin/profile']] },
  { table: 'parent_profiles', queryKeys: [['/api/parents'], ['/api/parent/profile']] },
  { table: 'classes', queryKeys: [['/api/classes'], ['/api/admin/classes'], ['/api/teacher/classes']] },
  { table: 'subjects', queryKeys: [['/api/subjects'], ['/api/admin/subjects']] },
  { table: 'exams', queryKeys: [['/api/exams'], ['/api/admin/exams'], ['/api/teacher/exams'], ['/api/student/exams']] },
  { table: 'exam_results', queryKeys: [['/api/exam-results'], ['/api/results'], ['/api/admin/results'], ['/api/teacher/results'], ['/api/student/results']] },
  { table: 'exam_sessions', queryKeys: [['/api/exam-sessions'], ['/api/student/exam-sessions']] },
  { table: 'student_answers', queryKeys: [['/api/student-answers'], ['/api/teacher/grading']] },
  { table: 'attendance', queryKeys: [['/api/attendance'], ['/api/admin/attendance'], ['/api/teacher/attendance'], ['/api/student/attendance']] },
  { table: 'announcements', queryKeys: [['/api/announcements'], ['/api/admin/announcements'], ['/api/public/announcements']] },
  { table: 'messages', queryKeys: [['/api/messages'], ['/api/student/messages'], ['/api/teacher/messages']] },
  { table: 'gallery', queryKeys: [['/api/gallery'], ['/api/admin/gallery'], ['/api/public/gallery']] },
  { table: 'gallery_categories', queryKeys: [['/api/gallery-categories'], ['/api/admin/gallery-categories']] },
  { table: 'notifications', queryKeys: [['/api/notifications'], ['/api/admin/notifications']] },
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

export function useGlobalRealtime() {
  useEffect(() => {
    if (!isRealtimeEnabled() || !supabase) {
      console.log('⚠️ Supabase Realtime is not enabled - individual page subscriptions will use polling fallback');
      return;
    }

    console.log('🔴 Initializing global Supabase Realtime system...');
    console.log(`📊 Monitoring ${GLOBAL_REALTIME_TABLES.length} tables for instant updates`);

    const channels: RealtimeChannel[] = [];

    GLOBAL_REALTIME_TABLES.forEach(({ table, queryKeys }) => {
      const channel = supabase
        .channel(`global:${table}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          (payload) => {
            console.log(`🔴 Global realtime: ${table} ${payload.eventType}`);
            
            queryKeys.forEach((queryKey) => {
              queryClient.invalidateQueries({ queryKey, exact: false });
            });
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`✅ Global subscription active: ${table}`);
          }
        });

      channels.push(channel);
    });

    return () => {
      console.log('🔌 Cleaning up global Supabase Realtime subscriptions...');
      channels.forEach((channel) => {
        supabase?.removeChannel(channel);
      });
    };
  }, []);

  return {
    isEnabled: isRealtimeEnabled(),
    tableCount: GLOBAL_REALTIME_TABLES.length
  };
}
