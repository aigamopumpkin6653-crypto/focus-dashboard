import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X, ChevronLeft, ChevronRight, Clock, Edit2, FileText, BookOpen, Calendar, Search, MoreVertical, Download, Upload, RefreshCw, Check, Mic } from 'lucide-react';

const StickyNoteTodo = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchKeyword, setSearchKeyword] = useState('');
  
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('tasks');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [completedTasks, setCompletedTasks] = useState(() => {
    const saved = localStorage.getItem('completedTasks');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [dailyNotes, setDailyNotes] = useState(() => {
    const saved = localStorage.getItem('dailyNotes');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [showAddTask, setShowAddTask] = useState(false);
  const [categories] = useState(['仕事', '学習', '個人', 'その他']);
  const [newTask, setNewTask] = useState({ 
    name: '', 
    category: '仕事', 
    isRoutine: false,
    routineTime: 'morning',
    memo: '',
    subtasks: []
  });
  
  const [editingTask, setEditingTask] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', category: '', isRoutine: false, routineTime: 'morning' });
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [memoTask, setMemoTask] = useState(null);
  const [memoContent, setMemoContent] = useState('');
  const [showDailyNoteModal, setShowDailyNoteModal] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [weekViewDate, setWeekViewDate] = useState(new Date());
  const [weekViewSelectedDate, setWeekViewSelectedDate] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState('');
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [subtaskModalTask, setSubtaskModalTask] = useState(null);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [taskMenuOpen, setTaskMenuOpen] = useState(null);
  const [isRecordingPlan, setIsRecordingPlan] = useState(false);
  const [isRecordingReflection, setIsRecordingReflection] = useState(false);
  const [recognition, setRecognition] = useState(null);

  const dustyColors = {
    '仕事': '#D37A68',
    '学習': '#E6D48F',
    '個人': '#90B6C8',
    'その他': '#A5BFA8'
  };

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.lang = 'ja-JP';
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      setRecognition(recognitionInstance);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
  }, [completedTasks]);

  useEffect(() => {
    localStorage.setItem('dailyNotes', JSON.stringify(dailyNotes));
  }, [dailyNotes]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('.menu-container')) {
        setShowMenu(false);
      }
      if (taskMenuOpen !== null) {
        const clickedInsideMenu = event.target.closest('.task-card-menu');
        if (!clickedInsideMenu) {
          setTaskMenuOpen(null);
        }
      }
    };
    
    if (showMenu || taskMenuOpen !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [showMenu, taskMenuOpen]);

  const formatDateStr = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    
    setIsTransitioning(true);
    setSlideDirection(days > 0 ? 'left' : 'right');
    
    setTimeout(() => {
      setSelectedDate(newDate);
      setIsTransitioning(false);
      setSlideDirection('');
    }, 150);
  };

  const selectedDateStr = useMemo(() => formatDateStr(selectedDate), [selectedDate]);

  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const weekDays = useMemo(() => {
    const start = getWeekStart(weekViewDate);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
  }, [weekViewDate]);

  const getTaskCountForDate = (date) => {
    const dateStr = formatDateStr(date);
    const dayTasks = tasks.filter(t => {
      if (t.isRoutine) {
        const taskCreatedStr = formatDateStr(t.createdAt);
        const isCompletedOnDate = completedTasks.some(ct => 
          ct.id === t.id && formatDateStr(ct.completedAt) === dateStr
        );
        return dateStr >= taskCreatedStr && !isCompletedOnDate;
      }
      const taskDateStr = formatDateStr(t.createdAt);
      const isCompletedOnDate = completedTasks.some(ct => 
        ct.id === t.id && formatDateStr(ct.completedAt) === dateStr
      );
      return taskDateStr === dateStr && !isCompletedOnDate;
    });
    
    const dayCompleted = completedTasks.filter(ct => {
      const completedDateStr = formatDateStr(ct.completedAt);
      return completedDateStr === dateStr;
    });

    return { active: dayTasks.length, completed: dayCompleted.length };
  };

  const hasNoteForDate = (date) => {
    const dateStr = formatDateStr(date);
    const note = dailyNotes[dateStr];
    return note && (note.plan || note.reflection);
  };

  const weekViewSelectedDateStr = useMemo(() => 
    weekViewSelectedDate ? formatDateStr(weekViewSelectedDate) : '', 
    [weekViewSelectedDate]
  );

  const weekViewTasks = useMemo(() => {
    if (!weekViewSelectedDate) return [];
    return tasks.filter(t => {
      if (t.isRoutine) {
        const taskCreatedStr = formatDateStr(t.createdAt);
        const isCompletedOnDate = completedTasks.some(ct => 
          ct.id === t.id && formatDateStr(ct.completedAt) === weekViewSelectedDateStr
        );
        return weekViewSelectedDateStr >= taskCreatedStr && !isCompletedOnDate;
      }
      const taskDateStr = formatDateStr(t.createdAt);
      const isCompletedOnDate = completedTasks.some(ct => 
        ct.id === t.id && formatDateStr(ct.completedAt) === weekViewSelectedDateStr
      );
      return taskDateStr === weekViewSelectedDateStr && !isCompletedOnDate;
    });
  }, [tasks, weekViewSelectedDate, weekViewSelectedDateStr, completedTasks]);

  const weekViewCompleted = useMemo(() => {
    if (!weekViewSelectedDate) return [];
    return completedTasks.filter(ct => {
      const completedDateStr = formatDateStr(ct.completedAt);
      return completedDateStr === weekViewSelectedDateStr;
    });
  }, [completedTasks, weekViewSelectedDate, weekViewSelectedDateStr]);

  const weekViewDailyNote = useMemo(() => {
    if (!weekViewSelectedDate) return { plan: '', reflection: '' };
    return dailyNotes[weekViewSelectedDateStr] || { plan: '', reflection: '' };
  }, [dailyNotes, weekViewSelectedDate, weekViewSelectedDateStr]);
  const matchesSearch = (text) => {
    if (!searchKeyword.trim()) return true;
    return text.toLowerCase().includes(searchKeyword.toLowerCase());
  };

  const todayTasks = useMemo(() => {
    const filtered = tasks.filter(t => {
      if (t.isRoutine) {
        const taskCreatedStr = formatDateStr(t.createdAt);
        const isCompletedToday = completedTasks.some(ct => 
          ct.id === t.id && formatDateStr(ct.completedAt) === selectedDateStr
        );
        return selectedDateStr >= taskCreatedStr && !isCompletedToday;
      }
      const taskDateStr = formatDateStr(t.createdAt);
      const isCompletedToday = completedTasks.some(ct => 
        ct.id === t.id && formatDateStr(ct.completedAt) === selectedDateStr
      );
      return taskDateStr === selectedDateStr && !isCompletedToday;
    });

    if (searchKeyword.trim()) {
      return filtered.filter(t => 
        matchesSearch(t.name) || matchesSearch(t.memo || '')
      );
    }
    return filtered;
  }, [tasks, selectedDateStr, completedTasks, searchKeyword]);

  const todayCompleted = useMemo(() => {
    const filtered = completedTasks.filter(ct => {
      const completedDateStr = formatDateStr(ct.completedAt);
      return completedDateStr === selectedDateStr;
    });

    if (searchKeyword.trim()) {
      return filtered.filter(t => 
        matchesSearch(t.name) || matchesSearch(t.memo || '')
      );
    }
    return filtered;
  }, [completedTasks, selectedDateStr, searchKeyword]);

  const morningRoutines = useMemo(() => {
    return todayTasks.filter(t => t.isRoutine && t.routineTime === 'morning');
  }, [todayTasks]);

  const eveningRoutines = useMemo(() => {
    return todayTasks.filter(t => t.isRoutine && t.routineTime === 'evening');
  }, [todayTasks]);

  const normalTasks = useMemo(() => {
    return todayTasks.filter(t => !t.isRoutine);
  }, [todayTasks]);

  const addTask = () => {
    if (newTask.name.trim()) {
      setTasks([...tasks, {
        id: Date.now(),
        ...newTask,
        createdAt: selectedDate.toISOString()
      }]);
      setNewTask({ 
        name: '', 
        category: '仕事', 
        isRoutine: false,
        routineTime: 'morning',
        memo: '',
        subtasks: []
      });
      setShowAddTask(false);
    }
  };

  const completeTask = (task) => {
    const now = new Date();
    const completedTask = {
      ...task,
      completedAt: now.toISOString()
    };
    setCompletedTasks([...completedTasks, completedTask]);
  };

  const uncompleteTask = (completedTask) => {
    setCompletedTasks(completedTasks.filter(ct => 
      !(ct.id === completedTask.id && formatDateStr(ct.completedAt) === selectedDateStr)
    ));
  };

  const deleteTask = (taskId) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const deleteCompletedTask = (completedTask) => {
    setCompletedTasks(completedTasks.filter(ct => 
      !(ct.id === completedTask.id && formatDateStr(ct.completedAt) === selectedDateStr)
    ));
  };

  const carryOverAllTasks = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDateStr(yesterday);
    
    const yesterdayTasks = tasks.filter(t => {
      if (t.isRoutine || t.carriedOverTo) return false;
      const taskDateStr = formatDateStr(t.createdAt);
      const isCompletedYesterday = completedTasks.some(ct => 
        ct.id === t.id && formatDateStr(ct.completedAt) === yesterdayStr
      );
      return taskDateStr === yesterdayStr && !isCompletedYesterday;
    });
    
    if (yesterdayTasks.length === 0) {
      alert('昨日の未完了タスクはありません');
      return;
    }
    
    setTasks(tasks.map(t => 
      yesterdayTasks.some(yt => yt.id === t.id)
        ? { ...t, carriedOverTo: formatDateStr(today) }
        : t
    ));
    
    setTimeout(() => {
      const newTasks = yesterdayTasks.map(task => ({
        ...task,
        id: Date.now() + Math.random(),
        createdAt: today.toISOString(),
        carriedOverFrom: task.carriedOverFrom || formatDateStr(task.createdAt),
        carriedOverTo: undefined
      }));
      setTasks(prev => [...prev, ...newTasks]);
      alert(`${yesterdayTasks.length}件のタスクを繰り越しました！`);
    }, 100);
    
    setSelectedDate(today);
  };

  const startEditTask = (task, e) => {
    e.stopPropagation();
    setEditingTask(task.id);
    setEditFormData({
      name: task.name,
      category: task.category,
      isRoutine: task.isRoutine,
      routineTime: task.routineTime
    });
  };

  const saveEditTask = () => {
    if (editFormData.name.trim()) {
      setTasks(tasks.map(t => 
        t.id === editingTask 
          ? { ...t, ...editFormData }
          : t
      ));
      setEditingTask(null);
    }
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setEditFormData({ name: '', category: '', isRoutine: false, routineTime: 'morning' });
  };

  const openMemoModal = (task, e) => {
    e.stopPropagation();
    setMemoTask(task);
    setMemoContent(task.memo || '');
    setShowMemoModal(true);
  };

  const saveMemo = () => {
    if (memoTask) {
      setTasks(tasks.map(t => 
        t.id === memoTask.id 
          ? { ...t, memo: memoContent }
          : t
      ));
      setShowMemoModal(false);
      setMemoTask(null);
      setMemoContent('');
    }
  };

  const closeMemoModal = () => {
    setShowMemoModal(false);
    setMemoTask(null);
    setMemoContent('');
  };

  const currentDailyNote = useMemo(() => {
    return dailyNotes[selectedDateStr] || { plan: '', reflection: '' };
  }, [dailyNotes, selectedDateStr]);

  const saveDailyNote = (field, value) => {
    setDailyNotes({
      ...dailyNotes,
      [selectedDateStr]: {
        ...currentDailyNote,
        [field]: value
      }
    });
  };

  const exportData = () => {
    const data = {
      tasks,
      completedTasks,
      dailyNotes,
      exportDate: new Date().toISOString()
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focus-dashboard-backup-${formatDateStr(new Date())}.json`;
    
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    setTimeout(() => {
      alert(`✅ バックアップファイルを作成しました`);
    }, 200);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        if (data.tasks) setTasks(data.tasks);
        if (data.completedTasks) setCompletedTasks(data.completedTasks);
        if (data.dailyNotes) setDailyNotes(data.dailyNotes);
        
        alert(`✅ データを復元しました`);
        
        setShowMenu(false);
      } catch (error) {
        alert('❌ ファイルの読み込みに失敗しました');
        setShowMenu(false);
      }
    };
    reader.onerror = () => {
      alert('❌ ファイルの読み込みに失敗しました');
      setShowMenu(false);
    };
    reader.readAsText(file);
    
    event.target.value = '';
  };

  const minSwipeDistance = 100;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      changeDate(1);
    }
    if (isRightSwipe) {
      changeDate(-1);
    }
  };

  const openSubtaskModal = (task, e) => {
    e.stopPropagation();
    setSubtaskModalTask(task);
    setShowSubtaskModal(true);
  };

  const closeSubtaskModal = () => {
    setShowSubtaskModal(false);
    setSubtaskModalTask(null);
    setNewSubtaskText('');
  };

  const addSubtask = () => {
    if (newSubtaskText.trim() && subtaskModalTask) {
      const updatedTask = {
        ...subtaskModalTask,
        subtasks: [
          ...(subtaskModalTask.subtasks || []),
          { id: Date.now(), text: newSubtaskText, completed: false }
        ]
      };
      setTasks(tasks.map(t => t.id === subtaskModalTask.id ? updatedTask : t));
      setSubtaskModalTask(updatedTask);
      setNewSubtaskText('');
    }
  };

  const toggleSubtask = (subtaskId) => {
    if (subtaskModalTask) {
      const updatedTask = {
        ...subtaskModalTask,
        subtasks: subtaskModalTask.subtasks.map(st =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        )
      };
      setTasks(tasks.map(t => t.id === subtaskModalTask.id ? updatedTask : t));
      setSubtaskModalTask(updatedTask);
    }
  };

  const deleteSubtask = (subtaskId) => {
    if (subtaskModalTask) {
      const updatedTask = {
        ...subtaskModalTask,
        subtasks: subtaskModalTask.subtasks.filter(st => st.id !== subtaskId)
      };
      setTasks(tasks.map(t => t.id === subtaskModalTask.id ? updatedTask : t));
      setSubtaskModalTask(updatedTask);
    }
  };

  const getSubtaskStats = (task) => {
    if (!task.subtasks || task.subtasks.length === 0) return null;
    const completed = task.subtasks.filter(st => st.completed).length;
    const total = task.subtasks.length;
    return { completed, total };
  };

  const startVoiceInput = (field) => {
    if (!recognition) {
      alert('お使いのブラウザは音声入力に対応していません。Chrome、Edge、Safariをお試しください。');
      return;
    }

    if (field === 'plan') {
      if (isRecordingPlan) {
        recognition.stop();
        setIsRecordingPlan(false);
      } else {
        setIsRecordingPlan(true);
        recognition.start();
        
        recognition.onresult = (event) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          saveDailyNote('plan', currentDailyNote.plan + transcript);
        };
        
        recognition.onerror = () => {
          setIsRecordingPlan(false);
        };
        
        recognition.onend = () => {
          setIsRecordingPlan(false);
        };
      }
    } else if (field === 'reflection') {
      if (isRecordingReflection) {
        recognition.stop();
        setIsRecordingReflection(false);
      } else {
        setIsRecordingReflection(true);
        recognition.start();
        
        recognition.onresult = (event) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          saveDailyNote('reflection', currentDailyNote.reflection + transcript);
        };
        
        recognition.onerror = () => {
          setIsRecordingReflection(false);
        };
        
        recognition.onend = () => {
          setIsRecordingReflection(false);
        };
      }
    }
  };

  const TaskCard = ({ task, onComplete, isCompleted = false }) => {
    const subtaskStats = getSubtaskStats(task);
    const isMenuOpen = taskMenuOpen === task.id;
    const [tapCount, setTapCount] = useState(0);
    const [tapTimer, setTapTimer] = useState(null);
    
    const handleMenuClick = (e) => {
      e.stopPropagation();
      setTaskMenuOpen(isMenuOpen ? null : task.id);
    };
    
    const handleTaskClick = () => {
      setTapCount(prev => prev + 1);
      
      if (tapTimer) {
        clearTimeout(tapTimer);
      }
      
      const timer = setTimeout(() => {
        if (tapCount + 1 >= 2) {
          onComplete(task);
        }
        setTapCount(0);
      }, 300);
      
      setTapTimer(timer);
    };
    
    return (
      <div
        className="p-4 rounded-lg shadow-sm transition-all hover:shadow-md group relative"
        style={{ 
          backgroundColor: dustyColors[task.category],
          minWidth: '140px',
          maxWidth: '160px',
          opacity: isCompleted ? 0.7 : 1
        }}
      >
        <div 
          className="cursor-pointer"
          onClick={handleTaskClick}
        >
          <div className={`text-white font-medium text-sm mb-1 pr-6 ${isCompleted ? 'line-through' : ''}`}>
            {task.name}
          </div>
          {task.carriedOverFrom && !isCompleted && (
            <div className="text-white text-xs mb-1" style={{ opacity: 0.9 }}>
              🔄 {task.carriedOverFrom}から
            </div>
          )}
          {task.isRoutine ? (
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.3)', color: 'white' }}>
                {task.routineTime === 'morning' ? '🌅 朝' : '🌙 夜'}
              </span>
            </div>
          ) : (
            <div className="text-white text-xs opacity-80">
              {task.category}
            </div>
          )}
          {isCompleted && task.completedAt && (
            <div className="text-white text-xs opacity-60 mt-1">
              <Clock size={10} className="inline mr-1" />
              {new Date(task.completedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
          {subtaskStats && (
            <div className="text-white text-xs mt-1" style={{ opacity: isCompleted ? 0.7 : 0.9 }}>
              ✓ {subtaskStats.completed}/{subtaskStats.total}
            </div>
          )}
        </div>
        
        <div className="absolute top-2 right-2 task-card-menu">
          <button
            onClick={handleMenuClick}
            className="p-1.5 rounded bg-white bg-opacity-20 hover:bg-opacity-40 transition-all"
            title="メニュー"
          >
            <MoreVertical size={16} className="text-white" />
          </button>
          
          {isMenuOpen && (
            <div 
              className="absolute right-0 mt-1 rounded-lg shadow-lg overflow-hidden z-10"
              style={{ backgroundColor: '#FDF8F0', minWidth: '140px' }}
            >
              {!isCompleted ? (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openMemoModal(task, e);
                      setTaskMenuOpen(null);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-100 transition-all text-sm"
                    style={{ color: '#4A4542' }}
                  >
                    <FileText size={14} />
                    メモ
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openSubtaskModal(task, e);
                      setTaskMenuOpen(null);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-100 transition-all text-sm"
                    style={{ color: '#4A4542' }}
                  >
                    <BookOpen size={14} />
                    チェックリスト
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditTask(task, e);
                      setTaskMenuOpen(null);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-100 transition-all text-sm"
                    style={{ color: '#4A4542' }}
                  >
                    <Edit2 size={14} />
                    編集
                  </button>
                </>
              ) : (
                <>
                  {task.memo && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMemoTask(task);
                        setMemoContent(task.memo || '');
                        setShowMemoModal(true);
                        setTaskMenuOpen(null);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-100 transition-all text-sm"
                      style={{ color: '#4A4542' }}
                    >
                      <FileText size={14} />
                      メモを見る
                    </button>
                  )}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSubtaskModalTask(task);
                        setShowSubtaskModal(true);
                        setTaskMenuOpen(null);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-100 transition-all text-sm"
                      style={{ color: '#4A4542' }}
                    >
                      <BookOpen size={14} />
                      チェックリスト
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('この完了済みタスクを削除しますか？')) {
                        deleteCompletedTask(task);
                      }
                      setTaskMenuOpen(null);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-100 transition-all text-sm"
                    style={{ color: '#D37A68' }}
                  >
                    <X size={14} />
                    削除
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5EAD8' }}>
      <div className="sticky top-0 z-50 backdrop-blur-sm" style={{ backgroundColor: 'rgba(245, 234, 216, 0.95)', borderBottom: '1px solid #E8D4BC' }}>
        <div className="max-w-full mx-auto px-2 py-2">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 flex-shrink min-w-0">
              <button onClick={() => changeDate(-1)} className="p-1.5 rounded transition-all hover:bg-gray-200 flex-shrink-0">
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={() => {
                  setShowDailyNoteModal(true);
                  setWeekViewDate(selectedDate);
                  setWeekViewSelectedDate(selectedDate);
                }}
                className="font-bold cursor-pointer hover:opacity-70 transition-all flex items-baseline gap-1 px-2 py-1 rounded-lg min-w-0" 
                style={{ 
                  color: formatDateStr(selectedDate) === formatDateStr(new Date()) ? 'white' : '#2D2A27',
                  backgroundColor: formatDateStr(selectedDate) === formatDateStr(new Date()) ? '#C9A882' : 'transparent'
                }}
              >
                <span className="text-lg md:text-3xl whitespace-nowrap">
                  {selectedDate.getMonth() + 1}/{selectedDate.getDate()}
                </span>
                <span className="text-xs md:text-lg whitespace-nowrap">
                  ({['日', '月', '火', '水', '木', '金', '土'][selectedDate.getDay()]})
                </span>
              </button>
              <button onClick={() => changeDate(1)} className="p-1.5 rounded transition-all hover:bg-gray-200 flex-shrink-0">
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {formatDateStr(selectedDate) !== formatDateStr(new Date()) && (
                <button 
                  onClick={() => {
                    setIsTransitioning(true);
                    setSlideDirection('right');
                    setTimeout(() => {
                      setSelectedDate(new Date());
                      setIsTransitioning(false);
                      setSlideDirection('');
                    }, 150);
                  }} 
                  className="p-2 rounded-lg transition-all hover:opacity-80 active:scale-95"
                  style={{ backgroundColor: '#90B6C8', color: 'white' }}
                >
                  <Calendar size={20} />
                </button>
              )}
              <button 
                onClick={() => setShowAddTask(true)} 
                className="p-2 rounded-lg transition-all hover:opacity-80"
                style={{ backgroundColor: '#E6D48F', color: 'white' }}
              >
                <Plus size={20} />
              </button>
              <div className="relative menu-container">
                <button 
                  onClick={() => setShowMenu(!showMenu)} 
                  className="p-2 rounded-lg transition-all hover:opacity-80"
                  style={{ backgroundColor: '#D37A68', color: 'white' }}
                >
                  <MoreVertical size={20} />
                </button>
                {showMenu && (
                  <div 
                    className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg overflow-hidden z-50"
                    style={{ backgroundColor: '#FDF8F0', border: '2px solid #E8D4BC' }}
                  >
                    <button
                      onClick={() => {
                        setShowSearchBar(!showSearchBar);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-100 transition-all"
                      style={{ color: '#4A4542' }}
                    >
                      <Search size={18} />
                      <span className="text-sm">検索</span>
                    </button>
                    <button
                      onClick={() => {
                        carryOverAllTasks();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-100 transition-all"
                      style={{ color: '#4A4542' }}
                    >
                      <RefreshCw size={18} />
                      <span className="text-sm">昨日を一括繰り越し</span>
                    </button>
                    <button
                      onClick={() => {
                        exportData();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-100 transition-all"
                      style={{ color: '#4A4542' }}
                    >
                      <Download size={18} />
                      <span className="text-sm">バックアップ</span>
                    </button>
                    <label
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 transition-all cursor-pointer"
                      style={{ color: '#4A4542' }}
                    >
                      <Upload size={18} />
                      <span className="text-sm">復元</span>
                      <input 
                        type="file" 
                        accept=".json" 
                        onChange={importData} 
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {showSearchBar && (
            <div className="relative mt-2">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: '#8B8680' }} />
              <input 
                type="text" 
                value={searchKeyword} 
                onChange={(e) => setSearchKeyword(e.target.value)} 
                placeholder="タスクや日記を検索..." 
                className="w-full pl-10 pr-10 py-2 rounded-lg border-2 focus:outline-none text-sm"
                style={{ 
                  borderColor: '#E8D4BC', 
                  backgroundColor: 'white',
                  color: '#4A4542'
                }}
                autoFocus
              />
              {searchKeyword && (
                <button 
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition-all"
                >
                  <X size={16} style={{ color: '#8B8680' }} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div 
        className="px-3 py-4 transition-all duration-150"
        style={{
          transform: isTransitioning 
            ? slideDirection === 'left' 
              ? 'translateX(-20px)' 
              : 'translateX(20px)'
            : 'translateX(0)',
          opacity: isTransitioning ? 0.5 : 1
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="max-w-6xl mx-auto">
          <div 
            className="mb-6 p-4 rounded-lg border-2 min-h-[200px]" 
            style={{ backgroundColor: '#FDF8F0', borderColor: '#E8D4BC' }}
          >
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#4A4542' }}>
              📝 残タスク
            </h2>

            {morningRoutines.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-3">
                  {morningRoutines.map(task => (
                    <TaskCard key={task.id} task={task} onComplete={completeTask} />
                  ))}
                </div>
              </div>
            )}

            {normalTasks.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-3">
                  {normalTasks.map(task => (
                    <TaskCard key={task.id} task={task} onComplete={completeTask} />
                  ))}
                </div>
              </div>
            )}

            {eveningRoutines.length > 0 && (
              <div>
                <div className="flex flex-wrap gap-3">
                  {eveningRoutines.map(task => (
                    <TaskCard key={task.id} task={task} onComplete={completeTask} />
                  ))}
                </div>
              </div>
            )}

            {todayTasks.length === 0 && (
              <div className="text-center py-8 text-sm" style={{ color: '#8B8680' }}>
                タスクがありません
              </div>
            )}
          </div>

          <div 
            className="p-4 rounded-lg border-2 min-h-[200px] mb-6" 
            style={{ backgroundColor: '#E8F4E0', borderColor: '#D4E4C8' }}
          >
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#4A4542' }}>
              ✅ 完了済み
            </h2>
            <div className="flex flex-wrap gap-3">
              {todayCompleted.map((task, index) => (
                <TaskCard key={`${task.id}-${index}`} task={task} onComplete={uncompleteTask} isCompleted={true} />
              ))}
            </div>
            {todayCompleted.length === 0 && (
              <div className="text-center py-8 text-sm" style={{ color: '#8B8680' }}>
                完了したタスクはありません
              </div>
            )}
          </div>

          <div 
            className="p-4 rounded-lg border-2" 
            style={{ 
              backgroundColor: '#FDF8F0', 
              borderColor: '#E8D4BC'
            }}
          >
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: '#4A4542' }}>
              📓 今日の日記
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-sm font-semibold flex items-center gap-1" style={{ color: '#8B8680' }}>
                    📝 今日の予定
                  </h3>
                  <button
                    onClick={() => startVoiceInput('plan')}
                    className={`p-1.5 rounded-lg transition-all ${isRecordingPlan ? 'animate-pulse' : ''}`}
                    style={{ 
                      backgroundColor: isRecordingPlan ? '#EF4444' : '#E8D4BC',
                      color: 'white'
                    }}
                    title={isRecordingPlan ? '録音中...クリックで停止' : '音声入力'}
                  >
                    <Mic size={16} />
                  </button>
                </div>
                <textarea
                  value={currentDailyNote.plan}
                  onChange={(e) => saveDailyNote('plan', e.target.value)}
                  placeholder="今日やること、目標、予定など..."
                  className="w-full px-3 py-2 rounded-lg focus:outline-none resize-none text-sm"
                  style={{ backgroundColor: 'white', color: '#6B6660', minHeight: '140px', border: '1px solid #E8D4BC' }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-sm font-semibold flex items-center gap-1" style={{ color: '#8B8680' }}>
                    💭 振り返り
                  </h3>
                  <button
                    onClick={() => startVoiceInput('reflection')}
                    className={`p-1.5 rounded-lg transition-all ${isRecordingReflection ? 'animate-pulse' : ''}`}
                    style={{ 
                      backgroundColor: isRecordingReflection ? '#EF4444' : '#E8D4BC',
                      color: 'white'
                    }}
                    title={isRecordingReflection ? '録音中...クリックで停止' : '音声入力'}
                  >
                    <Mic size={16} />
                  </button>
                </div>
                <textarea
                  value={currentDailyNote.reflection}
                  onChange={(e) => saveDailyNote('reflection', e.target.value)}
                  placeholder="今日の振り返り、気づき、感謝など..."
                  className="w-full px-3 py-2 rounded-lg focus:outline-none resize-none text-sm"
                  style={{ backgroundColor: 'white', color: '#6B6660', minHeight: '140px', border: '1px solid #E8D4BC' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {showDailyNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => {
          setShowDailyNoteModal(false);
          setWeekViewSelectedDate(null);
        }}>
          <div 
            className="rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: '#FDF8F0' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 p-4 border-b-2" style={{ backgroundColor: '#FDF8F0', borderColor: '#E8D4BC' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: '#4A4542' }}>
                  <Calendar size={20} />
                  週間ビュー
                </h3>
                <button 
                  onClick={() => {
                    setShowDailyNoteModal(false);
                    setWeekViewSelectedDate(null);
                  }} 
                  className="p-2 rounded-lg transition-all hover:bg-gray-200"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <button 
                    onClick={() => {
                      const newDate = new Date(weekViewDate);
                      newDate.setDate(newDate.getDate() - 7);
                      setWeekViewDate(newDate);
                    }}
                    className="p-2 rounded-lg transition-all hover:opacity-80"
                    style={{ backgroundColor: '#E8D4BC' }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className="text-center">
                    <p className="text-sm font-semibold" style={{ color: '#4A4542' }}>
                      {weekDays[0].getFullYear()}年 {weekDays[0].getMonth() + 1}月{weekDays[0].getDate()}日 〜 {weekDays[6].getMonth() + 1}月{weekDays[6].getDate()}日
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      const newDate = new Date(weekViewDate);
                      newDate.setDate(newDate.getDate() + 7);
                      setWeekViewDate(newDate);
                    }}
                    className="p-2 rounded-lg transition-all hover:opacity-80"
                    style={{ backgroundColor: '#E8D4BC' }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
                
                <div className="overflow-x-auto pb-2">
                  <div className="flex gap-2 min-w-max">
                    {weekDays.map((date, index) => {
                      const taskCount = getTaskCountForDate(date);
                      const hasNote = hasNoteForDate(date);
                      const isToday = formatDateStr(date) === formatDateStr(new Date());
                      const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
                      const isSelected = weekViewSelectedDate && formatDateStr(date) === formatDateStr(weekViewSelectedDate);
                      
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            if (!weekViewSelectedDate) {
                              setWeekViewSelectedDate(selectedDate);
                              setTimeout(() => {
                                setWeekViewSelectedDate(date);
                              }, 0);
                            } else {
                              setWeekViewSelectedDate(date);
                            }
                          }}
                          className="flex-shrink-0 p-3 rounded-lg border-2 transition-all hover:shadow-lg"
                          style={{
                            width: '80px',
                            backgroundColor: isSelected ? '#D37A68' : isToday ? '#E6D48F' : 'white',
                            borderColor: isSelected ? '#D37A68' : isToday ? '#E6D48F' : '#E8D4BC',
                            color: isSelected ? 'white' : '#4A4542'
                          }}
                        >
                          <div className="text-center">
                            <div className="text-xs font-medium mb-1" style={{ opacity: 0.8 }}>
                              {dayNames[date.getDay()]}
                            </div>
                            <div className="text-xl font-bold mb-2">
                              {date.getDate()}
                            </div>
                            <div className="space-y-1">
                              {taskCount.active > 0 && (
                                <div className="text-xs px-1.5 py-0.5 rounded" style={{ 
                                  backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : '#E8D4BC',
                                  color: isSelected ? 'white' : '#6B6660'
                                }}>
                                  📝 {taskCount.active}
                                </div>
                              )}
                              {taskCount.completed > 0 && (
                                <div className="text-xs px-1.5 py-0.5 rounded" style={{ 
                                  backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : '#B8D4A8',
                                  color: isSelected ? 'white' : '#5A7A4A'
                                }}>
                                  ✅ {taskCount.completed}
                                </div>
                              )}
                              {hasNote && (
                                <div className="text-xs px-1.5 py-0.5 rounded" style={{ 
                                  backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : '#90B6C8',
                                  color: isSelected ? 'white' : 'white'
                                }}>
                                  📓
                                </div>
                              )}
                              {taskCount.active === 0 && taskCount.completed === 0 && !hasNote && (
                                <div className="text-xs" style={{ opacity: 0.5 }}>
                                  -
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {weekViewSelectedDate && (
                <div className="p-4 rounded-lg border-2" style={{ backgroundColor: 'white', borderColor: '#E8D4BC' }}>
                  <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-base font-bold flex items-center gap-2" style={{ color: '#4A4542' }}>
                      <Calendar size={18} />
                      {weekViewSelectedDate.getMonth() + 1}月{weekViewSelectedDate.getDate()}日（{['日', '月', '火', '水', '木', '金', '土'][weekViewSelectedDate.getDay()]}）
                    </h4>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setSelectedDate(weekViewSelectedDate);
                          setShowDailyNoteModal(false);
                          setWeekViewSelectedDate(null);
                        }} 
                        className="px-3 py-1.5 rounded-lg text-sm transition-all hover:opacity-80 whitespace-nowrap font-medium" 
                        style={{ backgroundColor: '#D37A68', color: 'white' }}
                      >
                        この日に移動
                      </button>
                      <button 
                        onClick={() => {
                          setShowDailyNoteModal(false);
                          setWeekViewSelectedDate(null);
                        }} 
                        className="px-3 py-1.5 rounded-lg text-sm transition-all hover:opacity-80 whitespace-nowrap" 
                        style={{ backgroundColor: '#E8D4BC', color: '#6B6660' }}
                      >
                        閉じる
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h5 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#8B8680' }}>
                      📝 タスク
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg border-2" style={{ backgroundColor: '#FDF8F0', borderColor: '#E8D4BC' }}>
                        <h6 className="text-sm font-semibold mb-2" style={{ color: '#8B8680' }}>残タスク ({weekViewTasks.length}件)</h6>
                        {weekViewTasks.length > 0 ? (
                          <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {weekViewTasks.map(task => (
                              <div 
                                key={task.id}
                                className="text-sm p-2 rounded"
                                style={{ backgroundColor: dustyColors[task.category], color: 'white' }}
                              >
                                {task.name}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-center py-4" style={{ color: '#8B8680' }}>
                            残タスクなし
                          </div>
                        )}
                      </div>

                      <div className="p-3 rounded-lg border-2" style={{ backgroundColor: '#E8F4E0', borderColor: '#D4E4C8' }}>
                        <h6 className="text-sm font-semibold mb-2" style={{ color: '#8B8680' }}>完了済み ({weekViewCompleted.length}件)</h6>
                        {weekViewCompleted.length > 0 ? (
                          <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {weekViewCompleted.map((task, index) => (
                              <div 
                                key={`${task.id}-${index}`}
                                className="text-sm p-2 rounded line-through opacity-70"
                                style={{ backgroundColor: dustyColors[task.category], color: 'white' }}
                              >
                                {task.name}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-center py-4" style={{ color: '#8B8680' }}>
                            完了済みタスクなし
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#8B8680' }}>
                      📓 日記
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg border-2" style={{ backgroundColor: '#F5EAD8', borderColor: '#E8D4BC' }}>
                        <h6 className="text-sm font-semibold mb-2" style={{ color: '#8B8680' }}>📝 今日の予定</h6>
                        {weekViewDailyNote.plan ? (
                          <div className="text-sm whitespace-pre-wrap max-h-32 overflow-y-auto p-2 rounded" style={{ color: '#6B6660', backgroundColor: 'white' }}>
                            {weekViewDailyNote.plan}
                          </div>
                        ) : (
                          <div className="text-sm text-center py-4" style={{ color: '#8B8680' }}>
                            予定なし
                          </div>
                        )}
                      </div>
                      <div className="p-3 rounded-lg border-2" style={{ backgroundColor: '#F5EAD8', borderColor: '#E8D4BC' }}>
                        <h6 className="text-sm font-semibold mb-2" style={{ color: '#8B8680' }}>💭 振り返り</h6>
                        {weekViewDailyNote.reflection ? (
                          <div className="text-sm whitespace-pre-wrap max-h-32 overflow-y-auto p-2 rounded" style={{ color: '#6B6660', backgroundColor: 'white' }}>
                            {weekViewDailyNote.reflection}
                          </div>
                        ) : (
                          <div className="text-sm text-center py-4" style={{ color: '#8B8680' }}>
                            振り返りなし
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {showAddTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAddTask(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#FDF8F0' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: '#4A4542' }}>新しいタスク</h3>
              <button onClick={() => setShowAddTask(false)} className="p-1 rounded transition-all hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <input 
                type="text" 
                value={newTask.name} 
                onChange={(e) => setNewTask({ ...newTask, name: e.target.value })} 
                onKeyPress={(e) => e.key === 'Enter' && addTask()} 
                placeholder="タスク名..." 
                className="w-full px-3 py-2 border-2 rounded-lg focus:outline-none text-sm" 
                style={{ borderColor: '#E8D4BC' }}
                autoFocus
              />
              <select 
                value={newTask.category} 
                onChange={(e) => setNewTask({ ...newTask, category: e.target.value })} 
                className="w-full px-3 py-2 border rounded-lg text-sm" 
                style={{ borderColor: '#E8D4BC' }}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: '#6B6660' }}>
                <input 
                  type="checkbox" 
                  checked={newTask.isRoutine} 
                  onChange={(e) => setNewTask({ ...newTask, isRoutine: e.target.checked })} 
                />
                ルーティーンタスク
              </label>
              {newTask.isRoutine && (
                <select 
                  value={newTask.routineTime} 
                  onChange={(e) => setNewTask({ ...newTask, routineTime: e.target.value })} 
                  className="w-full px-3 py-2 border rounded-lg text-sm" 
                  style={{ borderColor: '#E8D4BC' }}
                >
                  <option value="morning">朝</option>
                  <option value="evening">夜</option>
                </select>
              )}
              <textarea 
                value={newTask.memo} 
                onChange={(e) => setNewTask({ ...newTask, memo: e.target.value })} 
                placeholder="メモ（任意）..." 
                className="w-full px-3 py-2 border-2 rounded-lg focus:outline-none resize-none text-sm" 
                style={{ borderColor: '#E8D4BC' }}
                rows="3"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button 
                onClick={addTask} 
                className="flex-1 px-4 py-2 rounded-lg text-white text-sm transition-all hover:opacity-80" 
                style={{ backgroundColor: '#B8D4A8' }}
              >
                追加
              </button>
              <button 
                onClick={() => setShowAddTask(false)} 
                className="px-4 py-2 rounded-lg text-sm transition-all hover:opacity-70" 
                style={{ backgroundColor: '#E8D4BC', color: '#6B6660' }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {showSubtaskModal && subtaskModalTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeSubtaskModal}>
          <div 
            className="rounded-lg shadow-2xl max-w-md w-full"
            style={{ backgroundColor: '#FDF8F0' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b-2" style={{ borderColor: '#E8D4BC' }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: '#4A4542' }}>
                  <BookOpen size={20} />
                  チェックリスト
                </h3>
                <button 
                  onClick={closeSubtaskModal} 
                  className="p-1 rounded-lg transition-all hover:bg-gray-200"
                >
                  <X size={20} />
                </button>
              </div>
              <div 
                className="text-sm font-medium px-2 py-1 rounded inline-block"
                style={{ backgroundColor: dustyColors[subtaskModalTask.category], color: 'white' }}
              >
                {subtaskModalTask.name}
              </div>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto">
              {subtaskModalTask.subtasks && subtaskModalTask.subtasks.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {subtaskModalTask.subtasks.map(subtask => (
                    <div 
                      key={subtask.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-all group"
                    >
                      <button
                        onClick={() => toggleSubtask(subtask.id)}
                        className="flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
                        style={{ 
                          borderColor: subtask.completed ? '#B8D4A8' : '#E8D4BC',
                          backgroundColor: subtask.completed ? '#B8D4A8' : 'white'
                        }}
                        disabled={subtaskModalTask.completedAt}
                      >
                        {subtask.completed && <Check size={14} className="text-white" />}
                      </button>
                      <span 
                        className="flex-1 text-sm"
                        style={{ 
                          color: subtask.completed ? '#8B8680' : '#4A4542',
                          textDecoration: subtask.completed ? 'line-through' : 'none'
                        }}
                      >
                        {subtask.text}
                      </span>
                      {!subtaskModalTask.completedAt && (
                        <button
                          onClick={() => deleteSubtask(subtask.id)}
                          className="flex-shrink-0 p-1 rounded hover:bg-red-100 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <X size={16} style={{ color: '#D37A68' }} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-sm" style={{ color: '#8B8680' }}>
                  チェックリストはまだありません
                </div>
              )}

              {!subtaskModalTask.completedAt && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtaskText}
                    onChange={(e) => setNewSubtaskText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSubtask()}
                    placeholder="新しい項目を追加..."
                    className="flex-1 px-3 py-2 border-2 rounded-lg focus:outline-none text-sm"
                    style={{ borderColor: '#E8D4BC' }}
                  />
                  <button
                    onClick={addSubtask}
                    className="px-4 py-2 rounded-lg transition-all hover:opacity-80"
                    style={{ backgroundColor: '#B8D4A8', color: 'white' }}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 border-t-2" style={{ borderColor: '#E8D4BC' }}>
              <button
                onClick={closeSubtaskModal}
                className="w-full px-4 py-2 rounded-lg transition-all hover:opacity-80"
                style={{ backgroundColor: '#E8D4BC', color: '#6B6660' }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {showMemoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeMemoModal}>
          <div 
            className="rounded-lg shadow-2xl max-w-md w-full"
            style={{ backgroundColor: '#FDF8F0' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b-2" style={{ borderColor: '#E8D4BC' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: '#4A4542' }}>
                  <FileText size={20} />
                  メモ
                </h3>
                <button 
                  onClick={closeMemoModal} 
                  className="p-1 rounded-lg transition-all hover:bg-gray-200"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-4">
              <textarea
                value={memoContent}
                onChange={(e) => setMemoContent(e.target.value)}
                placeholder="メモを入力..."
                className="w-full px-3 py-2 border-2 rounded-lg focus:outline-none resize-none text-sm"
                style={{ borderColor: '#E8D4BC', minHeight: '150px' }}
                readOnly={memoTask?.completedAt}
              />
            </div>

            <div className="p-4 border-t-2 flex gap-2" style={{ borderColor: '#E8D4BC' }}>
              {!memoTask?.completedAt ? (
                <>
                  <button
                    onClick={saveMemo}
                    className="flex-1 px-4 py-2 rounded-lg transition-all hover:opacity-80"
                    style={{ backgroundColor: '#B8D4A8', color: 'white' }}
                  >
                    保存
                  </button>
                  <button
                    onClick={closeMemoModal}
                    className="px-4 py-2 rounded-lg transition-all hover:opacity-80"
                    style={{ backgroundColor: '#E8D4BC', color: '#6B6660' }}
                  >
                    キャンセル
                  </button>
                </>
              ) : (
                <button
                  onClick={closeMemoModal}
                  className="w-full px-4 py-2 rounded-lg transition-all hover:opacity-80"
                  style={{ backgroundColor: '#E8D4BC', color: '#6B6660' }}
                >
                  閉じる
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={cancelEdit}>
          <div 
            className="rounded-lg shadow-2xl max-w-md w-full"
            style={{ backgroundColor: '#FDF8F0' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b-2" style={{ borderColor: '#E8D4BC' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: '#4A4542' }}>
                  <Edit2 size={20} />
                  タスク編集
                </h3>
                <button 
                  onClick={cancelEdit} 
                  className="p-1 rounded-lg transition-all hover:bg-gray-200"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <input
                type="text"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="w-full px-3 py-2 border-2 rounded-lg focus:outline-none text-sm"
                style={{ borderColor: '#E8D4BC' }}
              />
              <select
                value={editFormData.category}
                onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                className="w-full px-3 py-2 border-2 rounded-lg text-sm"
                style={{ borderColor: '#E8D4BC' }}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: '#6B6660' }}>
                <input
                  type="checkbox"
                  checked={editFormData.isRoutine}
                  onChange={(e) => setEditFormData({ ...editFormData, isRoutine: e.target.checked })}
                />
                ルーティーンタスク
              </label>
              {editFormData.isRoutine && (
                <select
                  value={editFormData.routineTime}
                  onChange={(e) => setEditFormData({ ...editFormData, routineTime: e.target.value })}
                  className="w-full px-3 py-2 border-2 rounded-lg text-sm"
                  style={{ borderColor: '#E8D4BC' }}
                >
                  <option value="morning">朝</option>
                  <option value="evening">夜</option>
                </select>
              )}
              
              <div className="pt-4 border-t-2" style={{ borderColor: '#E8D4BC' }}>
                <button
                  onClick={() => {
                    if (window.confirm('このタスクを削除しますか？')) {
                      deleteTask(editingTask);
                      setEditingTask(null);
                    }
                  }}
                  className="w-full px-4 py-2 rounded-lg transition-all hover:opacity-80 text-sm flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#D37A68', color: 'white' }}
                >
                  <X size={16} />
                  タスクを削除
                </button>
              </div>
            </div>

            <div className="p-4 border-t-2 flex gap-2" style={{ borderColor: '#E8D4BC' }}>
              <button
                onClick={saveEditTask}
                className="flex-1 px-4 py-2 rounded-lg transition-all hover:opacity-80"
                style={{ backgroundColor: '#B8D4A8', color: 'white' }}
              >
                保存
              </button>
              <button
                onClick={cancelEdit}
                className="px-4 py-2 rounded-lg transition-all hover:opacity-80"
                style={{ backgroundColor: '#E8D4BC', color: '#6B6660' }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StickyNoteTodo;