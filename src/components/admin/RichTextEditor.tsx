"use client";

import React, { useRef, useCallback, useEffect } from 'react';
import { Box, IconButton, Divider, Tooltip } from '@mui/material';
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
    isInternalChange.current = false;
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const execCmd = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    handleInput();
  };

  const isActive = (cmd: string) => {
    try {
      return document.queryCommandState(cmd);
    } catch {
      return false;
    }
  };

  return (
    <Box
      sx={{
        border: '1px solid rgba(0,0,0,0.23)',
        borderRadius: 1,
        overflow: 'hidden',
        '&:hover': { borderColor: 'rgba(0,0,0,0.87)' },
        '&:focus-within': { borderColor: 'primary.main', borderWidth: '2px' }
      }}
    >
      {/* Toolbar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.25,
          px: 1,
          py: 0.5,
          borderBottom: '1px solid rgba(0,0,0,0.12)',
          bgcolor: 'rgba(0,0,0,0.02)',
          flexWrap: 'wrap'
        }}
      >
        <Tooltip title="Negrita (Ctrl+B)" arrow>
          <IconButton size="small" onClick={() => execCmd('bold')} sx={{ borderRadius: 1 }}>
            <Bold size={16} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Cursiva (Ctrl+I)" arrow>
          <IconButton size="small" onClick={() => execCmd('italic')} sx={{ borderRadius: 1 }}>
            <Italic size={16} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Subrayado (Ctrl+U)" arrow>
          <IconButton size="small" onClick={() => execCmd('underline')} sx={{ borderRadius: 1 }}>
            <Underline size={16} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Tachado" arrow>
          <IconButton size="small" onClick={() => execCmd('strikeThrough')} sx={{ borderRadius: 1 }}>
            <Strikethrough size={16} />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

        <Tooltip title="Lista con viñetas" arrow>
          <IconButton size="small" onClick={() => execCmd('insertUnorderedList')} sx={{ borderRadius: 1 }}>
            <List size={16} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Lista numerada" arrow>
          <IconButton size="small" onClick={() => execCmd('insertOrderedList')} sx={{ borderRadius: 1 }}>
            <ListOrdered size={16} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Editable Area */}
      <Box
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        suppressContentEditableWarning
        sx={{
          p: 2,
          minHeight: 120,
          maxHeight: 300,
          overflowY: 'auto',
          outline: 'none',
          fontSize: '0.95rem',
          lineHeight: 1.7,
          color: 'text.primary',
          '&:empty::before': {
            content: `"${placeholder || 'Escribí la descripción del producto...'}"`,
            color: 'text.disabled',
          },
          '& b, & strong': { fontWeight: 700 },
          '& i, & em': { fontStyle: 'italic' },
          '& u': { textDecoration: 'underline' },
          '& s, & strike': { textDecoration: 'line-through' },
          '& ul, & ol': { pl: 3, mb: 1 },
          '& li': { mb: 0.5 },
        }}
      />
    </Box>
  );
};

export default RichTextEditor;
