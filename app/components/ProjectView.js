/* eslint-disable no-useless-constructor */
import React from 'react';

import PageContainer from './PageContainer';
import Button from './Button';
import EditableText from './EditableText';
import EditableAccountIcon from './EditableAccountIcon';
import AccountIcon from './AccountIcon';
import Box from './Box';

import styles from './ProjectView.css';
import localization from '../localization';
import backgroundSrc from '../../resources/dimmig_skog_svartvit_display.jpg';

const BACKGROUND_STYLE = {
  backgroundImage: `url(${backgroundSrc})`
};

export default function ProjectView({
  projectInfo,
  files,
  subpath,
  numPeers,
  uploading,
  onDownloadFile,
  onAddFiles,
  onDeleteFile,
  onNavigateTo,
  onSetSaved,
  onUpdateInfo,
  onUpdateImage,
  onDestroyProject,
  onClearFile,
  onSetAuthStrategy,
  onRequestWrite
}) {
  const {
    title,
    description,
    author,
    community,
    nation,
    image,
    writable,
    isSaved,
    authStrategy
  } = projectInfo;

  const addFilesButton = writable ? (
    <Button onClick={() => onAddFiles(false)}>
      {localization.project_view_add_files}
    </Button>
  ) : null;
  const addFoldersButton = writable ? (
    <Button onClick={() => onAddFiles(true)}>
      {localization.project_view_add_folders}
    </Button>
  ) : null;

  const destroyButton = writable ? (
    <div>
      <Button red onClick={onDestroyProject}>
        {localization.project_view_delete_project}
      </Button>
    </div>
  ) : null;

  function goUp() {
    onNavigateTo('..');
  }

  const upButton =
    subpath && subpath !== '/' ? (
      <div className={styles.filecontainer}>
        <Button
          flat
          className={styles.file}
          onClick={goUp}
          label={localization.project_view_go_up}
        >
          <i className="fas fa-folder fa-fw" />
          {` ../`}
        </Button>
      </div>
    ) : null;

  const saveForm = writable ? null : (
    <label htmlFor="save_project_checkbox">
      <input
        id="save_project_checkbox"
        type="checkbox"
        checked={!!isSaved}
        onChange={({ target }) => onSetSaved(target.checked)}
      />
      {localization.project_view_save_locally}
    </label>
  );

  const peersLabel = numPeers
    ? `(${localization.project_view_connected} ${numPeers})`
    : '';

  const titleElement = writable ? (
    <EditableText
      value={title}
      onUpdate={value => onUpdateInfo('title', value)}
    />
  ) : (
    title
  );

  const writeButton =
    authStrategy === 'allow' && !writable ? (
      <Button onClick={onRequestWrite}>
        {localization.project_view_ask_save}
      </Button>
    ) : null;

  const setAuthStrategy = writable ? (
    <div>
      <label htmlFor="set_auth_checkbox">
        <input
          id="set_auth_checkbox"
          type="checkbox"
          checked={authStrategy === 'allow'}
          onChange={({ target }) =>
            onSetAuthStrategy(target.checked ? 'allow' : 'deny')
          }
        />
        {localization.project_view_allow_save}
      </label>
    </div>
  ) : null;

  return (
    <PageContainer style={BACKGROUND_STYLE} contentClass={styles.content}>
      <Box className={styles.files}>
        <h3 className={styles.title}>
          {titleElement} {subpath} {peersLabel}
        </h3>
        {upButton}
        {files.map(({ stat, name }) => {
          const isDirectory = stat.isDirectory();
          const endSlash = isDirectory ? '/' : '';
          const icon = isDirectory ? (
            <i className="fas fa-folder fa-fw" />
          ) : (
            <i className="fas fa-file fa-fw" />
          );
          const onClick = isDirectory
            ? () => onNavigateTo(name)
            : () => onDownloadFile(name);
          const onClickDelete = () => onDeleteFile(name);
          const deleteButton =
            !isDirectory && writable ? (
              <Button
                flat
                type="button"
                className={styles.filedelete}
                onClick={onClickDelete}
                label={localization.project_view_delete_file}
              >
                <i className="fas fa-trash" />
              </Button>
            ) : null;

          const onClickClear = () => onClearFile(name);
          const { isDownloaded } = stat;
          const downloadPercent =
            isDownloaded !== 1 ? `${Math.round(isDownloaded * 100)}%` : null;
          const downloadIndicator =
            isDownloaded && !writable ? (
              <>
                <Button
                  flat
                  type="button"
                  onClick={onClick}
                  label="This file has been downloaded"
                >
                  <i className="fas fa-hdd fa-fw" />
                  {downloadPercent}
                </Button>
                <Button
                  flat
                  className={styles.filedelete}
                  label="Clear downloaded data"
                  onClick={onClickClear}
                >
                  <i className="fas fa-eraser fa-fw" />
                </Button>
              </>
            ) : null;

          return (
            <div key={name} className={styles.filecontainer}>
              <Button
                flat
                className={styles.file}
                onClick={onClick}
                label={`${localization.project_view_open_file} ${name}`}
              >
                {icon}
                {` /${name}${endSlash}`}
              </Button>
              {deleteButton}
              {downloadIndicator}
            </div>
          );
        })}
        {uploading.map(name => (
          <div key={name} className={styles.filecontainer}>
            <div
              flat
              className={styles.file}
              label={`${localization.project_view_open_file} ${name}`}
            >
              <i className="fa fa-upload fa-fw" />
              {name}
              <i className="fa fa-pulse fa-spinner fa-fw" />
            </div>
          </div>
        ))}
        <div>
          {addFilesButton}
          {addFoldersButton}
          {writeButton}
        </div>
      </Box>
      <Box className={styles.info}>
        <dl className={styles.infoitems}>
          <InfoItem
            writable={writable}
            label={localization.new_project_author}
            value={author}
            onUpdate={value => onUpdateInfo('author', value)}
          />
          <InfoItem
            writable={writable}
            label={localization.new_project_community}
            value={community}
            onUpdate={value => onUpdateInfo('community', value)}
          />
          <InfoItem
            writable={writable}
            label={localization.new_project_nation}
            value={nation}
            onUpdate={value => onUpdateInfo('nation', value)}
          />
          <InfoItem
            writable={writable}
            label={localization.new_project_credits}
            value={description}
            onUpdate={value => onUpdateInfo('description', value)}
          />
        </dl>
        <ImageInfoItem
          image={image}
          onUpdate={onUpdateImage}
          writable={writable}
        />
        {saveForm}
        {setAuthStrategy}
        {destroyButton}
      </Box>
    </PageContainer>
  );
}

function InfoItem({ label, value, onUpdate, writable }) {
  if (writable)
    return (
      <>
        <dt>{label}</dt>
        <dd>
          <EditableText value={value} onUpdate={onUpdate} />
        </dd>
      </>
    );

  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

function ImageInfoItem({ image, onUpdate, writable }) {
  if (writable) {
    return <EditableAccountIcon image={image} onChange={onUpdate} />;
  }

  if (!image) return null;

  return <AccountIcon image={image} />;
}
