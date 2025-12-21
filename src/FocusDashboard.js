import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X, ChevronLeft, ChevronRight, Clock, Edit2, FileText, BookOpen, Calendar, Search, MoreVertical, Download, Upload } from 'lucide-react';

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
  const [categories, setCategories] = useState(['仕事', '学習', '個人', 'その他']);
  
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
  }, [completedTasks]);

  useEffect(() => {
    localStorage.setItem('dailyNotes', JSON.stringify(dailyNotes));
  }, [dailyNotes]);
  
  const [newTask, setNewTask] = useState({ 
    name: '', 
    category: '仕事', 
    isRoutine: false,
    routineTime: 'morning',
    memo: ''
  });
  const [draggedTask, setDraggedTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', category: '', isRoutine: false, routineTime: 'morning' });
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [memoTask, setMemoTask] = useState(null);
  const [memoContent, setMemoContent] = useState('');
  const [showDailyNoteModal, setShowDailyNoteModal] = useState(false);
  const [dailyNoteTab, setDailyNoteTab] = useState('plan');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const dustyColors = {
    '仕事': '#D37A68',
    '学習': '#E6D48F',
    '個人': '#90B6C8',
    'その他': '#A5BFA8'
  };

  const formatDateStr = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const selectedDateStr = useMemo(() => formatDateStr(selectedDate), [selectedDate]);

  // 検索フィルター関数
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

    // 検索フィルター適用
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

    // 検索フィルター適用
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

  // 日記の検索マッチ判定
  const diaryMatchesSearch = useMemo(() => {
    if (!searchKeyword.trim()) return false;
    const note = dailyNotes[selectedDateStr];
    if (!note) return false;
    return matchesSearch(note.plan || '') || matchesSearch(note.reflection || '');
  }, [dailyNotes, selectedDateStr, searchKeyword]);

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
        memo: ''
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

  const handleDragStart = (task, isCompleted = false) => {
    setDraggedTask({ ...task, wasCompleted: isCompleted });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDropToActive = (e) => {
    e.preventDefault();
    if (draggedTask && draggedTask.wasCompleted) {
      uncompleteTask(draggedTask);
      setDraggedTask(null);
    }
  };

  const handleDropToCompleted = (e) => {
    e.preventDefault();
    if (draggedTask && !draggedTask.wasCompleted) {
      completeTask(draggedTask);
      setDraggedTask(null);
    }
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
    
    // iOSのための追加処理
    document.body.appendChild(a);
    a.click();
    
    // クリーンアップ
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    // ユーザーに確認
    setTimeout(() => {
      alert(`✅ バックアップファイルを作成しました！\n\nタスク: ${tasks.length}件\n完了済み: ${completedTasks.length}件\n日記: ${Object.keys(dailyNotes).length}日分\n\nダウンロードフォルダを確認してください。`);
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
        
        alert(`✅ データを復元しました！\n\nタスク: ${data.tasks?.length || 0}件\n完了済み: ${data.completedTasks?.length || 0}件\n日記: ${Object.keys(data.dailyNotes || {}).length}日分`);
        
        // メニューを閉じる
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5EAD8' }}>
      {/* ヘッダー */}
      <div className="sticky top-0 z-50 backdrop-blur-sm" style={{ backgroundColor: 'rgba(245, 234, 216, 0.95)', borderBottom: '1px solid #E8D4BC' }}>
        <div className="max-w-full mx-auto px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => changeDate(-1)} className="p-1.5 rounded transition-all hover:bg-gray-200">
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setShowDailyNoteModal(true)}
                className="font-bold cursor-pointer hover:opacity-70 transition-all flex items-baseline gap-1" 
                style={{ color: '#2D2A27' }}
                title="カレンダーと日記を開く"
              >
                <span className="text-xl md:text-3xl">
                  {selectedDate.getMonth() + 1}/{selectedDate.getDate()}
                </span>
                <span className="text-sm md:text-lg">
                  ({['日', '月', '火', '水', '木', '金', '土'][selectedDate.getDay()]})
                </span>
              </button>
              <button onClick={() => changeDate(1)} className="p-1.5 rounded transition-all hover:bg-gray-200">
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSelectedDate(new Date())} 
                className="p-2.5 rounded-lg transition-all hover:opacity-80"
                style={{ backgroundColor: '#D37A68', color: 'white' }}
                title="今日に戻る"
              >
                <Calendar size={22} />
              </button>
              <button 
                onClick={() => setShowAddTask(!showAddTask)} 
                className="p-2.5 rounded-lg transition-all hover:opacity-80"
                style={{ backgroundColor: '#E6D48F', color: 'white' }}
                title="タスク追加"
              >
                <Plus size={22} />
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowMenu(!showMenu)} 
                  className="p-2.5 rounded-lg transition-all hover:opacity-80"
                  style={{ backgroundColor: showMenu ? '#D37A68' : '#90B6C8', color: 'white' }}
                  title="メニュー"
                >
                  <MoreVertical size={22} />
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
                        onChange={(e) => {
                          importData(e);
                        }} 
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 検索バー（トグル表示） */}
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
                  title="検索をクリア"
                >
                  <X size={16} style={{ color: '#8B8680' }} />
                </button>
              )}
            </div>
          )}

          {/* 検索結果表示 */}
          {showSearchBar && searchKeyword && (
            <div className="mt-2 text-xs" style={{ color: '#8B8680' }}>
              検索結果: タスク {todayTasks.length + todayCompleted.length}件
              {diaryMatchesSearch && ' / 日記にヒット'}
            </div>
          )}
        </div>
      </div>

      {/* タスク追加フォーム */}
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

      {/* タスク編集フォーム */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={cancelEdit}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#FDF8F0' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: '#4A4542' }}>タスクを編集</h3>
              <button onClick={cancelEdit} className="p-1 rounded transition-all hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <input 
                type="text" 
                value={editFormData.name} 
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} 
                onKeyPress={(e) => e.key === 'Enter' && saveEditTask()} 
                placeholder="タスク名..." 
                className="w-full px-3 py-2 border-2 rounded-lg focus:outline-none text-sm" 
                style={{ borderColor: '#E8D4BC' }}
                autoFocus
              />
              <select 
                value={editFormData.category} 
                onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })} 
                className="w-full px-3 py-2 border rounded-lg text-sm" 
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
                  className="w-full px-3 py-2 border rounded-lg text-sm" 
                  style={{ borderColor: '#E8D4BC' }}
                >
                  <option value="morning">朝</option>
                  <option value="evening">夜</option>
                </select>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button 
                onClick={saveEditTask} 
                className="flex-1 px-4 py-2 rounded-lg text-white text-sm transition-all hover:opacity-80" 
                style={{ backgroundColor: '#B8D4A8' }}
              >
                保存
              </button>
              <button 
                onClick={cancelEdit} 
                className="px-4 py-2 rounded-lg text-sm transition-all hover:opacity-70" 
                style={{ backgroundColor: '#E8D4BC', color: '#6B6660' }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 日記モーダル */}
      {showDailyNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDailyNoteModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#FDF8F0' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: '#4A4542' }}>
                <Calendar size={20} />
                カレンダーと日記
              </h3>
              <button onClick={() => setShowDailyNoteModal(false)} className="p-1 rounded transition-all hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>

            <div className="mb-4 p-4 rounded-lg border-2" style={{ backgroundColor: '#F5EAD8', borderColor: '#E8D4BC' }}>
              <div className="text-center mb-3">
                <p className="text-base font-semibold" style={{ color: '#4A4542' }}>
                  {selectedDate.getFullYear()}年 {selectedDate.getMonth() + 1}月
                </p>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {['日', '月', '火', '水', '木', '金', '土'].map(day => (
                  <div key={day} className="text-center text-sm font-medium py-1" style={{ color: '#8B8680' }}>{day}</div>
                ))}
                {(() => {
                  const year = selectedDate.getFullYear();
                  const month = selectedDate.getMonth();
                  const firstDay = new Date(year, month, 1).getDay();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const today = new Date();
                  const days = [];
                  for (let i = 0; i < firstDay; i++) {
                    days.push(<div key={`empty-${i}`} className="h-10"></div>);
                  }
                  for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, month, day);
                    const dateStr = formatDateStr(date);
                    const isSelected = date.toDateString() === selectedDate.toDateString();
                    const isTodayDate = date.toDateString() === today.toDateString();
                    const hasNote = dailyNotes[dateStr] && (dailyNotes[dateStr].plan || dailyNotes[dateStr].reflection);
                    days.push(
                      <button 
                        key={day} 
                        onClick={() => setSelectedDate(date)}
                        className="h-10 rounded flex items-center justify-center transition-all hover:opacity-80 relative"
                        style={{
                          backgroundColor: isSelected ? '#D37A68' : isTodayDate ? '#E6D48F' : 'transparent',
                          color: isSelected ? 'white' : isTodayDate ? '#8B7A4A' : '#4A4542',
                          fontWeight: (isSelected || isTodayDate) ? 'bold' : 'normal'
                        }}
                      >
                        {day}
                        {hasNote && !isSelected && (
                          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#90B6C8' }}></span>
                        )}
                      </button>
                    );
                  }
                  return days;
                })()}
              </div>
            </div>
            
            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => setDailyNoteTab('plan')}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ 
                  backgroundColor: dailyNoteTab === 'plan' ? '#E6D48F' : '#E8D4BC',
                  color: dailyNoteTab === 'plan' ? '#6B6660' : '#8B8680'
                }}
              >
                📝 今日の予定
              </button>
              <button 
                onClick={() => setDailyNoteTab('reflection')}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ 
                  backgroundColor: dailyNoteTab === 'reflection' ? '#E6D48F' : '#E8D4BC',
                  color: dailyNoteTab === 'reflection' ? '#6B6660' : '#8B8680'
                }}
              >
                💭 振り返り
              </button>
            </div>

            {dailyNoteTab === 'plan' && (
              <div>
                <p className="text-sm mb-2" style={{ color: '#8B8680' }}>今日やること、目標、予定など...</p>
                <textarea 
                  value={currentDailyNote.plan} 
                  onChange={(e) => saveDailyNote('plan', e.target.value)} 
                  placeholder="例：午前中に企画書を完成させる、ジムに行く" 
                  className="w-full px-3 py-2 border-2 rounded-lg focus:outline-none resize-none text-sm" 
                  style={{ borderColor: '#E8D4BC', backgroundColor: '#F5EAD8' }}
                  rows="12"
                />
              </div>
            )}

            {dailyNoteTab === 'reflection' && (
              <div>
                <p className="text-sm mb-2" style={{ color: '#8B8680' }}>今日の振り返り、気づき、感謝など...</p>
                <textarea 
                  value={currentDailyNote.reflection} 
                  onChange={(e) => saveDailyNote('reflection', e.target.value)} 
                  placeholder="例：集中力が続いてよかった、明日は早めに起きよう" 
                  className="w-full px-3 py-2 border-2 rounded-lg focus:outline-none resize-none text-sm" 
                  style={{ borderColor: '#E8D4BC', backgroundColor: '#F5EAD8' }}
                  rows="12"
                />
              </div>
            )}

            <div className="flex justify-end mt-4">
              <button 
                onClick={() => setShowDailyNoteModal(false)} 
                className="px-6 py-2 rounded-lg text-sm transition-all hover:opacity-80" 
                style={{ backgroundColor: '#B8D4A8', color: 'white' }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* メモモーダル */}
      {showMemoModal && memoTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeMemoModal}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#FDF8F0' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: '#4A4542' }}>📝 タスクメモ</h3>
              <button onClick={closeMemoModal} className="p-1 rounded transition-all hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>
            <div className="mb-3 p-2 rounded" style={{ backgroundColor: dustyColors[memoTask.category] }}>
              <div className="text-white font-semibold text-sm">{memoTask.name}</div>
            </div>
            <textarea 
              value={memoContent} 
              onChange={(e) => setMemoContent(e.target.value)} 
              placeholder="メモを入力..." 
              className="w-full px-3 py-2 border-2 rounded-lg focus:outline-none resize-none text-sm" 
              style={{ borderColor: '#E8D4BC', backgroundColor: '#F5EAD8' }}
              rows="8"
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button 
                onClick={saveMemo} 
                className="flex-1 px-4 py-2 rounded-lg text-white text-sm transition-all hover:opacity-80" 
                style={{ backgroundColor: '#B8D4A8' }}
              >
                保存
              </button>
              <button 
                onClick={closeMemoModal} 
                className="px-4 py-2 rounded-lg text-sm transition-all hover:opacity-70" 
                style={{ backgroundColor: '#E8D4BC', color: '#6B6660' }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-3 py-4">
        <div className="max-w-6xl mx-auto">
          {/* 残タスクエリア */}
          <div 
            className="mb-6 p-4 rounded-lg border-2 min-h-[200px]" 
            style={{ backgroundColor: '#FDF8F0', borderColor: '#E8D4BC' }}
            onDragOver={handleDragOver}
            onDrop={handleDropToActive}
          >
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#4A4542' }}>
              📝 残タスク
            </h2>

            {/* 朝のルーティーン */}
            {morningRoutines.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-3">
                  {morningRoutines.map(task => (
                    <div
                      key={task.id}
                      className="p-4 rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-md group relative"
                      style={{ 
                        backgroundColor: dustyColors[task.category],
                        minWidth: '140px',
                        maxWidth: '160px'
                      }}
                      onClick={() => completeTask(task)}
                    >
                      <div className="text-white font-medium text-sm mb-1">{task.name}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.3)', color: 'white' }}>
                          🌅 朝
                        </span>
                        {task.memo && (
                          <FileText size={12} className="text-white opacity-70" title="メモあり" />
                        )}
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button
                          onClick={(e) => openMemoModal(task, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white hover:bg-opacity-20"
                          title="メモ"
                        >
                          <FileText size={14} className="text-white" />
                        </button>
                        <button
                          onClick={(e) => startEditTask(task, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white hover:bg-opacity-20"
                          title="編集"
                        >
                          <Edit2 size={14} className="text-white" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white hover:bg-opacity-20"
                          title="削除"
                        >
                          <X size={14} className="text-white" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 通常タスク */}
            {normalTasks.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-3">
                  {normalTasks.map(task => (
                    <div
                      key={task.id}
                      className="p-4 rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-md group relative"
                      style={{ 
                        backgroundColor: dustyColors[task.category],
                        minWidth: '140px',
                        maxWidth: '160px'
                      }}
                      onClick={() => completeTask(task)}
                    >
                      <div className="text-white font-medium text-sm mb-1">{task.name}</div>
                      <div className="text-white text-xs opacity-80 flex items-center gap-2">
                        <span>{task.category}</span>
                        {task.memo && (
                          <FileText size={12} className="text-white opacity-70" title="メモあり" />
                        )}
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button
                          onClick={(e) => openMemoModal(task, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white hover:bg-opacity-20"
                          title="メモ"
                        >
                          <FileText size={14} className="text-white" />
                        </button>
                        <button
                          onClick={(e) => startEditTask(task, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white hover:bg-opacity-20"
                          title="編集"
                        >
                          <Edit2 size={14} className="text-white" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white hover:bg-opacity-20"
                          title="削除"
                        >
                          <X size={14} className="text-white" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 夜のルーティーン */}
            {eveningRoutines.length > 0 && (
              <div>
                <div className="flex flex-wrap gap-3">
                  {eveningRoutines.map(task => (
                    <div
                      key={task.id}
                      className="p-4 rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-md group relative"
                      style={{ 
                        backgroundColor: dustyColors[task.category],
                        minWidth: '140px',
                        maxWidth: '160px'
                      }}
                      onClick={() => completeTask(task)}
                    >
                      <div className="text-white font-medium text-sm mb-1">{task.name}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.3)', color: 'white' }}>
                          🌙 夜
                        </span>
                        {task.memo && (
                          <FileText size={12} className="text-white opacity-70" title="メモあり" />
                        )}
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button
                          onClick={(e) => openMemoModal(task, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white hover:bg-opacity-20"
                          title="メモ"
                        >
                          <FileText size={14} className="text-white" />
                        </button>
                        <button
                          onClick={(e) => startEditTask(task, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white hover:bg-opacity-20"
                          title="編集"
                        >
                          <Edit2 size={14} className="text-white" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white hover:bg-opacity-20"
                          title="削除"
                        >
                          <X size={14} className="text-white" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {todayTasks.length === 0 && (
              <div className="text-center py-8 text-sm" style={{ color: '#8B8680' }}>
                {searchKeyword ? '検索結果がありません' : 'タスクがありません。「タスク追加」ボタンから追加しましょう！'}
              </div>
            )}
          </div>

          {/* 完了済みエリア */}
          <div 
            className="p-4 rounded-lg border-2 min-h-[200px] mb-6" 
            style={{ backgroundColor: '#E8F4E0', borderColor: '#D4E4C8' }}
            onDragOver={handleDragOver}
            onDrop={handleDropToCompleted}
          >
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#4A4542' }}>
              ✅ 完了済み
            </h2>
            <div className="flex flex-wrap gap-3">
              {todayCompleted.map((task, index) => (
                <div
                  key={`${task.id}-${index}`}
                  className="p-4 rounded-lg shadow-sm cursor-move transition-all hover:shadow-md group relative opacity-70"
                  style={{ 
                    backgroundColor: dustyColors[task.category],
                    minWidth: '140px',
                    maxWidth: '160px'
                  }}
                  draggable
                  onDragStart={() => handleDragStart(task, true)}
                  onClick={() => uncompleteTask(task)}
                >
                  <div className="text-white font-medium text-sm mb-1 line-through">{task.name}</div>
                  {task.isRoutine ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.3)', color: 'white' }}>
                        {task.routineTime === 'morning' ? '🌅 朝' : '🌙 夜'}
                      </span>
                      {task.memo && (
                        <FileText size={12} className="text-white opacity-70" title="メモあり" />
                      )}
                    </div>
                  ) : (
                    <div className="text-white text-xs opacity-80 flex items-center gap-2">
                      <span>{task.category}</span>
                      {task.memo && (
                        <FileText size={12} className="text-white opacity-70" title="メモあり" />
                      )}
                    </div>
                  )}
                  <div className="text-white text-xs opacity-60 mt-1">
                    <Clock size={10} className="inline mr-1" />
                    {new Date(task.completedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={(e) => openMemoModal(task, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white hover:bg-opacity-20"
                      title="メモ"
                    >
                      <FileText size={14} className="text-white" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteCompletedTask(task); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white hover:bg-opacity-20"
                      title="削除"
                    >
                      <X size={14} className="text-white" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {todayCompleted.length === 0 && (
              <div className="text-center py-8 text-sm" style={{ color: '#8B8680' }}>
                {searchKeyword ? '検索結果がありません' : '完了したタスクはありません'}
              </div>
            )}
          </div>

          {/* 今日の日記エリア */}
          <div 
            className="p-4 rounded-lg border-2" 
            style={{ 
              backgroundColor: '#FDF8F0', 
              borderColor: diaryMatchesSearch ? '#90B6C8' : '#E8D4BC',
              borderWidth: diaryMatchesSearch ? '3px' : '2px'
            }}
          >
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#4A4542' }}>
              📓 今日の日記
              {diaryMatchesSearch && (
                <span className="text-xs font-normal px-2 py-1 rounded" style={{ backgroundColor: '#90B6C8', color: 'white' }}>
                  検索ヒット
                </span>
              )}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 今日の予定 */}
              <div className="p-3 rounded-lg border" style={{ backgroundColor: '#F5EAD8', borderColor: '#E8D4BC' }}>
                <h3 className="text-sm font-semibold mb-2" style={{ color: '#8B8680' }}>📝 今日の予定</h3>
                <textarea
                  value={currentDailyNote.plan}
                  onChange={(e) => saveDailyNote('plan', e.target.value)}
                  placeholder="今日やること、目標、予定など..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none resize-none text-sm"
                  style={{ borderColor: '#E8D4BC', backgroundColor: 'white', color: '#6B6660', minHeight: '120px' }}
                />
              </div>

              {/* 振り返り */}
              <div className="p-3 rounded-lg border" style={{ backgroundColor: '#F5EAD8', borderColor: '#E8D4BC' }}>
                <h3 className="text-sm font-semibold mb-2" style={{ color: '#8B8680' }}>💭 振り返り</h3>
                <textarea
                  value={currentDailyNote.reflection}
                  onChange={(e) => saveDailyNote('reflection', e.target.value)}
                  placeholder="今日の振り返り、気づき、感謝など..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none resize-none text-sm"
                  style={{ borderColor: '#E8D4BC', backgroundColor: 'white', color: '#6B6660', minHeight: '120px' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickyNoteTodo;