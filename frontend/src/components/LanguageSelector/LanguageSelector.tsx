import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Box,
  Typography
} from '@mui/material';
import {
  Language as LanguageIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
// Las funciones de i18n se importan del hook personalizado
// import { changeLanguage, getCurrentLanguage, getAvailableLanguages } from '../../i18n';

// Iconos de banderas como emojis
const FLAG_ICONS = {
  en: '🇺🇸',
  es: '🇪🇸',
  pt: '🇧🇷',
  fr: '🇫🇷'
};

interface LanguageSelectorProps {
  variant?: 'icon' | 'text' | 'both';
  size?: 'small' | 'medium' | 'large';
  showCurrentLanguage?: boolean;
}

export default function LanguageSelector({
  variant = 'icon',
  size = 'medium',
  showCurrentLanguage = false
}: LanguageSelectorProps) {
  const { t, i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  const currentLanguage = i18n.language;
  const availableLanguages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    { code: 'fr', name: 'French', nativeName: 'Français' }
  ];
  
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleLanguageChange = async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode);
      localStorage.setItem('aerosynapse-language', languageCode);
      handleClose();
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };
  
  const getCurrentLanguageInfo = () => {
    return availableLanguages.find(lang => lang.code === currentLanguage) || availableLanguages[0];
  };
  
  const currentLangInfo = getCurrentLanguageInfo();
  
  const renderTrigger = () => {
    switch (variant) {
      case 'text':
        return (
          <Box
            onClick={handleClick}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 1,
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
          >
            <span style={{ fontSize: size === 'small' ? '16px' : '20px' }}>
              {FLAG_ICONS[currentLanguage as keyof typeof FLAG_ICONS]}
            </span>
            <Typography variant={size === 'small' ? 'caption' : 'body2'}>
              {currentLangInfo.nativeName}
            </Typography>
          </Box>
        );
      
      case 'both':
        return (
          <Box
            onClick={handleClick}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 1,
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
          >
            <LanguageIcon fontSize={size} />
            <span style={{ fontSize: size === 'small' ? '16px' : '20px' }}>
              {FLAG_ICONS[currentLanguage as keyof typeof FLAG_ICONS]}
            </span>
            {showCurrentLanguage && (
              <Typography variant={size === 'small' ? 'caption' : 'body2'}>
                {currentLangInfo.code.toUpperCase()}
              </Typography>
            )}
          </Box>
        );
      
      default: // 'icon'
        return (
          <Tooltip title={`${t('common.language')}: ${currentLangInfo.nativeName}`}>
            <IconButton
              onClick={handleClick}
              size={size}
              sx={{
                color: 'inherit',
                position: 'relative'
              }}
            >
              <LanguageIcon />
              {/* Mini bandera en la esquina */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  fontSize: '10px',
                  lineHeight: 1,
                  backgroundColor: 'background.paper',
                  borderRadius: '50%',
                  width: 16,
                  height: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                {FLAG_ICONS[currentLanguage as keyof typeof FLAG_ICONS]}
              </Box>
            </IconButton>
          </Tooltip>
        );
    }
  };
  
  return (
    <>
      {renderTrigger()}
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            minWidth: 200,
            border: '1px solid',
            borderColor: 'divider'
          }
        }}
      >
        <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            {t('common.select_language') || 'Select Language'}
          </Typography>
        </Box>
        
        {availableLanguages.map((language) => {
          const isSelected = language.code === currentLanguage;
          
          return (
            <MenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              selected={isSelected}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  }
                }
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
                <span style={{ fontSize: '20px' }}>
                  {FLAG_ICONS[language.code as keyof typeof FLAG_ICONS]}
                </span>
              </ListItemIcon>
              
              <ListItemText
                primary={language.nativeName}
                secondary={language.name}
                secondaryTypographyProps={{
                  sx: { 
                    color: 'rgba(255, 255, 255, 0.7)', 
                    fontSize: '0.75rem' 
                  }
                }}
              />
              
              {isSelected && (
                <CheckIcon sx={{ color: 'inherit', ml: 1 }} fontSize="small" />
              )}
            </MenuItem>
          );
        })}
        
        <Box sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.7rem' }}>
            {t('common.language_note') || 'Language changes apply immediately'}
          </Typography>
        </Box>
      </Menu>
    </>
  );
}

// Hook personalizado para usar el selector de idioma
export const useLanguageSelector = () => {
  const { i18n } = useTranslation();
  
  const changeLanguage = async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode);
      localStorage.setItem('aerosynapse-language', languageCode);
    } catch (error) {
      console.error('Error changing language:', error);
      throw error;
    }
  };
  
  const getCurrentLanguage = () => {
    return i18n.language;
  };
  
  const getAvailableLanguages = () => {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
      { code: 'fr', name: 'French', nativeName: 'Français' }
    ];
  };
  
  return {
    changeLanguage,
    getCurrentLanguage,
    getAvailableLanguages,
    currentLanguage: i18n.language
  };
};

export { FLAG_ICONS };