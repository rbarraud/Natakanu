import React from 'react';

import styles from './Button.css';

export default function ({ className = '', children, big, ...props }) {
	const classList = [styles.button]
	if(className) classList.push(className)
	if(big) classList.push(styles.big)
	return (
	  <button className={classList.join(' ')} {...props}>
	    {children}
	  </button>
  )
};
