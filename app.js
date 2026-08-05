// Service Worker Registration for Offline Support
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
}

// Storage Manager
const StorageManager = {
    save: (key, data) => localStorage.setItem(key, JSON.stringify(data)),
    load: (key) => {
        try {
            return JSON.parse(localStorage.getItem(key)) || null;
        } catch {
            return null;
        }
    },
    remove: (key) => localStorage.removeItem(key),
    clear: () => localStorage.clear()
};

// Dark Mode
const DarkMode = {
    init: () => {
        const isDark = StorageManager.load('darkMode') || false;
        if (isDark) DarkMode.enable();
        document.getElementById('theme-toggle').addEventListener('click', () => isDark ? DarkMode.disable() : DarkMode.enable());
    },
    enable: () => {
        document.body.classList.add('dark-mode');
        StorageManager.save('darkMode', true);
    },
    disable: () => {
        document.body.classList.remove('dark-mode');
        StorageManager.save('darkMode', false);
    }
};

// Tool Navigation
const ToolNav = {
    init: () => {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tool = btn.dataset.tool;
                ToolNav.switch(tool);
            });
        });
    },
    switch: (toolId) => {
        document.querySelectorAll('.tool-section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        
        document.getElementById(toolId)?.classList.add('active');
        document.querySelector(`[data-tool="${toolId}"]`)?.classList.add('active');
        
        const toolNames = {
            video: '🎬 Video Player',
            notes: '📝 Notes',
            todos: '✅ Todos',
            calculator: '🧮 Calculator',
            timer: '⏱️ Timer',
            'text-tools': '📄 Text Tools',
            images: '🖼️ Images',
            colors: '🎨 Colors',
            json: '📦 JSON Viewer',
            qr: '📱 QR Code'
        };
        document.getElementById('current-tool-name').textContent = toolNames[toolId] || 'Tool';
    }
};

// ===== VIDEO PLAYER =====
const VideoPlayer = {
    init: () => {
        const zone = document.getElementById('video-drop-zone');
        const input = document.getElementById('video-input');
        
        zone.addEventListener('click', () => input.click());
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('drag-over');
        });
        zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            VideoPlayer.handleFiles(e.dataTransfer.files);
        });
        
        input.addEventListener('change', (e) => VideoPlayer.handleFiles(e.target.files));
    },
    handleFiles: (files) => {
        const container = document.getElementById('video-container');
        container.innerHTML = '';
        
        for (const file of files) {
            if (file.type.startsWith('video/')) {
                const url = URL.createObjectURL(file);
                const video = document.createElement('video');
                video.src = url;
                video.controls = true;
                container.appendChild(video);
            }
        }
    }
};

// ===== NOTES =====
const Notes = {
    init: () => {
        Notes.render();
        document.getElementById('add-note-btn').addEventListener('click', Notes.add);
    },
    add: () => {
        const notes = StorageManager.load('notes') || [];
        notes.push({ id: Date.now(), text: '', created: new Date().toLocaleString() });
        StorageManager.save('notes', notes);
        Notes.render();
    },
    save: (id, text) => {
        const notes = StorageManager.load('notes') || [];
        const note = notes.find(n => n.id === id);
        if (note) note.text = text;
        StorageManager.save('notes', notes);
    },
    delete: (id) => {
        const notes = StorageManager.load('notes') || [];
        StorageManager.save('notes', notes.filter(n => n.id !== id));
        Notes.render();
    },
    render: () => {
        const container = document.getElementById('notes-container');
        const notes = StorageManager.load('notes') || [];
        
        container.innerHTML = notes.map(note => `
            <div class="note-card">
                <small style="opacity: 0.6;">${note.created}</small>
                <textarea placeholder="Write your note..." style="margin-top: 8px;">${note.text}</textarea>
                <div class="note-card-footer">
                    <button class="btn" onclick="Notes.save(${note.id}, document.querySelector('[data-note-id=\\'${note.id}\\']').value)">Save</button>
                    <button class="btn danger" onclick="Notes.delete(${note.id})">Delete</button>
                </div>
            </div>
        `).join('');
        
        document.querySelectorAll('.note-card textarea').forEach((ta, i) => {
            ta.dataset.noteId = notes[i].id;
            ta.addEventListener('input', (e) => {
                e.target.parentElement.querySelector('.btn').click();
            });
        });
    }
};

// ===== TODOS =====
const Todos = {
    init: () => {
        Todos.render();
        document.getElementById('add-todo-btn').addEventListener('click', Todos.add);
        document.getElementById('todo-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') Todos.add();
        });
    },
    add: () => {
        const input = document.getElementById('todo-input');
        const text = input.value.trim();
        if (!text) return;
        
        const todos = StorageManager.load('todos') || [];
        todos.push({ id: Date.now(), text, completed: false });
        StorageManager.save('todos', todos);
        input.value = '';
        Todos.render();
    },
    toggle: (id) => {
        const todos = StorageManager.load('todos') || [];
        const todo = todos.find(t => t.id === id);
        if (todo) todo.completed = !todo.completed;
        StorageManager.save('todos', todos);
        Todos.render();
    },
    delete: (id) => {
        const todos = StorageManager.load('todos') || [];
        StorageManager.save('todos', todos.filter(t => t.id !== id));
        Todos.render();
    },
    render: () => {
        const list = document.getElementById('todo-list');
        const todos = StorageManager.load('todos') || [];
        
        list.innerHTML = todos.map(todo => `
            <div class="todo-item ${todo.completed ? 'completed' : ''}">
                <input type="checkbox" ${todo.completed ? 'checked' : ''} onchange="Todos.toggle(${todo.id})">
                <span>${todo.text}</span>
                <button class="btn danger" style="margin-left: auto;" onclick="Todos.delete(${todo.id})">✕</button>
            </div>
        `).join('');
    }
};

// ===== CALCULATOR =====
const Calculator = {
    display: '',
    init: () => {
        const buttons = ['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '-', '0', '.', 'C', '+', '='];
        const container = document.getElementById('calc-buttons');
        
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = 'calc-btn';
            button.textContent = btn;
            
            if (['+', '-', '×', '÷'].includes(btn)) button.classList.add('operator');
            if (btn === '=') button.classList.add('equals');
            
            button.addEventListener('click', () => Calculator.handle(btn));
            container.appendChild(button);
        });
    },
    handle: (btn) => {
        const display = document.getElementById('calc-display');
        
        if (btn === 'C') {
            Calculator.display = '';
        } else if (btn === '=') {
            try {
                Calculator.display = eval(Calculator.display
                    .replace(/÷/g, '/')
                    .replace(/×/g, '*')
                ).toString();
            } catch {
                Calculator.display = 'Error';
            }
        } else {
            Calculator.display += btn;
        }
        
        display.value = Calculator.display || '0';
    }
};

// ===== TIMER & STOPWATCH =====
const Timer = {
    interval: null,
    totalSeconds: 0,
    remaining: 0,
    isRunning: false,
    isStopwatch: false,
    
    init: () => {
        document.getElementById('timer-tab').addEventListener('click', () => Timer.switchMode(false));
        document.getElementById('stopwatch-tab').addEventListener('click', () => Timer.switchMode(true));
        document.getElementById('timer-start-btn').addEventListener('click', () => Timer.start());
        document.getElementById('timer-pause-btn').addEventListener('click', () => Timer.pause());
        document.getElementById('timer-reset-btn').addEventListener('click', () => Timer.reset());
    },
    switchMode: (isStopwatch) => {
        Timer.isStopwatch = isStopwatch;
        clearInterval(Timer.interval);
        Timer.isRunning = false;
        Timer.remaining = 0;
        
        document.getElementById('timer-tab').classList.toggle('secondary', isStopwatch);
        document.getElementById('stopwatch-tab').classList.toggle('secondary', !isStopwatch);
        document.getElementById('timer-mode').classList.toggle('timer-mode-active', !isStopwatch);
        document.getElementById('timer-display').textContent = '00:00';
        document.getElementById('timer-start-btn').textContent = isStopwatch ? 'Start' : 'Start';
        document.getElementById('timer-start-btn').disabled = false;
        document.getElementById('timer-pause-btn').disabled = true;
    },
    start: () => {
        if (Timer.isRunning) return;
        
        if (!Timer.isStopwatch && Timer.remaining === 0) {
            const mins = parseInt(document.getElementById('timer-minutes').value) || 0;
            const secs = parseInt(document.getElementById('timer-seconds').value) || 0;
            Timer.remaining = mins * 60 + secs;
        }
        
        if (Timer.remaining <= 0 && !Timer.isStopwatch) return;
        
        Timer.isRunning = true;
        document.getElementById('timer-start-btn').disabled = true;
        document.getElementById('timer-pause-btn').disabled = false;
        
        Timer.interval = setInterval(() => {
            Timer.isStopwatch ? Timer.remaining++ : Timer.remaining--;
            Timer.updateDisplay();
            
            if (Timer.remaining <= 0 && !Timer.isStopwatch) {
                Timer.pause();
                alert('Time\'s up!');
            }
        }, 1000);
    },
    pause: () => {
        Timer.isRunning = false;
        clearInterval(Timer.interval);
        document.getElementById('timer-start-btn').disabled = false;
        document.getElementById('timer-pause-btn').disabled = true;
    },
    reset: () => {
        Timer.pause();
        Timer.remaining = 0;
        Timer.updateDisplay();
    },
    updateDisplay: () => {
        const mins = Math.floor(Timer.remaining / 60);
        const secs = Timer.remaining % 60;
        document.getElementById('timer-display').textContent = 
            `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
};

// ===== TEXT TOOLS =====
const TextTools = {
    init: () => {
        const input = document.getElementById('text-input');
        input.addEventListener('input', TextTools.updateStats);
        
        document.getElementById('uppercase-btn').addEventListener('click', () => {
            input.value = input.value.toUpperCase();
            TextTools.updateStats();
        });
        document.getElementById('lowercase-btn').addEventListener('click', () => {
            input.value = input.value.toLowerCase();
            TextTools.updateStats();
        });
        document.getElementById('reverse-btn').addEventListener('click', () => {
            input.value = input.value.split('').reverse().join('');
            TextTools.updateStats();
        });
        document.getElementById('copy-btn').addEventListener('click', () => {
            navigator.clipboard.writeText(input.value);
            alert('Copied to clipboard!');
        });
    },
    updateStats: () => {
        const text = document.getElementById('text-input').value;
        document.getElementById('char-count').textContent = text.length;
        document.getElementById('word-count').textContent = text.trim() ? text.trim().split(/\s+/).length : 0;
        document.getElementById('line-count').textContent = text.split('\n').length;
    }
};

// ===== IMAGE VIEWER =====
const ImageViewer = {
    init: () => {
        document.getElementById('add-image-btn').addEventListener('click', () => {
            document.getElementById('image-input').click();
        });
        document.getElementById('image-input').addEventListener('change', (e) => {
            ImageViewer.handleImages(e.target.files);
        });
        ImageViewer.render();
    },
    handleImages: (files) => {
        const images = StorageManager.load('images') || [];
        
        for (const file of files) {
            const reader = new FileReader();
            reader.onload = (e) => {
                images.push({ id: Date.now() + Math.random(), src: e.target.result });
                StorageManager.save('images', images);
                ImageViewer.render();
            };
            reader.readAsDataURL(file);
        }
    },
    render: () => {
        const grid = document.getElementById('image-grid');
        const images = StorageManager.load('images') || [];
        
        grid.innerHTML = images.map(img => `
            <div class="image-item" onclick="ImageViewer.preview('${img.id}')">
                <img src="${img.src}" alt="Image">
                <div style="padding: 8px; text-align: center;">
                    <button class="btn danger" onclick="ImageViewer.delete('${img.id}'); event.stopPropagation();" style="width: 100%;">Delete</button>
                </div>
            </div>
        `).join('');
    },
    preview: (id) => {
        const images = StorageManager.load('images') || [];
        const img = images.find(i => i.id === id);
        if (img) {
            const modal = window.open();
            modal.document.write(`<img src="${img.src}" style="width: 100%; height: 100%;">`);
        }
    },
    delete: (id) => {
        const images = StorageManager.load('images') || [];
        StorageManager.save('images', images.filter(i => i.id !== id));
        ImageViewer.render();
    }
};

// ===== COLOR PICKER =====
const ColorPicker = {
    init: () => {
        const input = document.getElementById('color-input');
        const display = document.getElementById('color-display');
        const hexValue = document.getElementById('hex-value');
        const rgbValue = document.getElementById('rgb-value');
        const copyBtn = document.getElementById('copy-color-btn');
        
        input.addEventListener('input', (e) => {
            const hex = e.target.value;
            display.style.background = hex;
            hexValue.textContent = hex.toUpperCase();
            
            const rgb = ColorPicker.hexToRgb(hex);
            rgbValue.textContent = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        });
        
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(hexValue.textContent);
            alert('Color copied to clipboard!');
        });
    },
    hexToRgb: (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }
};

// ===== JSON VIEWER =====
const JSONViewer = {
    init: () => {
        document.getElementById('json-input').addEventListener('input', JSONViewer.format);
    },
    format: () => {
        const input = document.getElementById('json-input').value;
        const output = document.getElementById('json-output');
        
        try {
            const json = JSON.parse(input);
            output.textContent = JSON.stringify(json, null, 2);
            output.style.color = 'inherit';
        } catch (e) {
            output.textContent = `Error: ${e.message}`;
            output.style.color = '#ef4444';
        }
    }
};

// ===== QR CODE GENERATOR =====
const QRGenerator = {
    init: () => {
        const input = document.getElementById('qr-input');
        input.addEventListener('input', QRGenerator.generate);
    },
    generate: () => {
        const input = document.getElementById('qr-input').value.trim();
        const output = document.getElementById('qr-output');
        
        if (!input) {
            output.innerHTML = '';
            return;
        }
        
        // Using QR Server API
        const qrUrl = `https://api.qrserver.com/v1/make-qr-code?size=300x300&data=${encodeURIComponent(input)}`;
        output.innerHTML = `<img src="${qrUrl}" alt="QR Code" style="max-width: 100%; border-radius: 8px;">`;
    }
};

// ===== CLEAR ALL DATA =====
document.getElementById('clear-all').addEventListener('click', () => {
    if (confirm('Are you sure you want to delete all data? This cannot be undone.')) {
        StorageManager.clear();
        location.reload();
    }
});

// ===== INFO BUTTON =====
document.getElementById('info-btn').addEventListener('click', () => {
    alert('🎯 Thing-mabobber v1.0\n\nAn all-in-one offline-capable productivity suite with:\n\n✨ Video Player - Drag & drop videos\n📝 Notes - Create unlimited notes\n✅ Todos - Manage tasks\n🧮 Calculator - Full calculator\n⏱️ Timer & Stopwatch\n📄 Text Tools - Analysis & transforms\n🖼️ Image Viewer - View your images\n🎨 Color Picker - Pick and copy colors\n📦 JSON Viewer - Format JSON\n📱 QR Code - Generate QR codes\n\nAll data stored locally in your browser.');
});

// Initialize all tools
document.addEventListener('DOMContentLoaded', () => {
    DarkMode.init();
    ToolNav.init();
    VideoPlayer.init();
    Notes.init();
    Todos.init();
    Calculator.init();
    Timer.init();
    TextTools.init();
    ImageViewer.init();
    ColorPicker.init();
    JSONViewer.init();
    QRGenerator.init();
});
