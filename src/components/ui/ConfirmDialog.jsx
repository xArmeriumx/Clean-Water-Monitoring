import React from 'react';
import {
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Button,
  useBreakpointValue,
} from '@chakra-ui/react';

/**
 * Reusable confirmation dialog
 * @param {boolean} isOpen - Whether dialog is open
 * @param {function} onClose - Close handler
 * @param {function} onConfirm - Confirm handler
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {string} confirmText - Confirm button text (default: "Confirm")
 * @param {string} cancelText - Cancel button text (default: "Cancel")
 * @param {string} confirmColorScheme - Confirm button color (default: "blue")
 * @param {boolean} isLoading - Loading state for confirm button
 */
function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm',
  message = 'Are you sure?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColorScheme = 'blue',
  isLoading = false,
}) {
  const cancelRef = React.useRef();
  const buttonSize = useBreakpointValue({ base: 'sm', md: 'md' });

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
    >
      <AlertDialogOverlay>
        <AlertDialogContent borderRadius="lg" bg="white">
          <AlertDialogHeader fontSize="lg" fontWeight="bold" color="gray.800">
            {title}
          </AlertDialogHeader>
          <AlertDialogBody color="gray.600">
            {message}
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose} size={buttonSize}>
              {cancelText}
            </Button>
            <Button
              colorScheme={confirmColorScheme}
              onClick={onConfirm}
              ml={3}
              size={buttonSize}
              isLoading={isLoading}
            >
              {confirmText}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}

export default ConfirmDialog;
